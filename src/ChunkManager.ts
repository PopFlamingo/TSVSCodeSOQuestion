import Phaser from "phaser"

class ChunkManager {
    /**
     * The scene on which the `ChunkManager` appends and
     * removes chunks, based on the camera viewport
     */
    readonly scene: Phaser.Scene

    readonly manifestURL: URL

    /**
     * The last world view from the `scene`s main camera
     */
    private lastWorldView?: Phaser.Geom.Rectangle

    private currentChunks = new Set<integer>()


    /**
     * Construct a ChunkManager
     * @param scene The scene to manage chunks of
     * @param manifestURL The URL of the chunks manifest file
     */
    constructor(scene: Phaser.Scene, manifestURL: URL) {
        this.scene = scene
        this.manifestURL = manifestURL
        this.scene.events.on("update", this.update)
    }


    /**
     * Update the 
     */
    private update() {
        let mainCamera = this.scene.cameras.main
        // Only update chunks if world view changed
        if (mainCamera.worldView !== this.lastWorldView) {
            // Update current world view
            this.lastWorldView = mainCamera.worldView
            
        }
    }

}

interface ChunkDescriptionJSON {
    relativeURL: string
    x: integer
    y: integer
    width: integer
    height: integer
}

interface ChunkManifestJSON {
    mapWidth: integer
    mapHeight: integer
    baseChunkWidth: integer
    baseChunkHeight: integer
    chunkCount: integer
    globalMapURL: string
    chunks: { [index: number]: ChunkDescriptionJSON }
}

export class ChunkDescription {
    relativeURL: URL
    x: integer
    y: integer
    width: integer
    height: integer

    constructor(relativeURL: URL, x: integer, y: integer, width: integer, height: integer) {
        this.relativeURL = relativeURL
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }

    static fromJSON(json: ChunkDescriptionJSON): ChunkDescription {
        return new ChunkDescription(new URL(json.relativeURL), json.x, json.y, json.width, json.height)
    }
}

export class ChunkManifest {
    readonly mapWidth: integer
    readonly mapHeight: integer
    readonly baseChunkWidth: integer
    readonly baseChunkHeight: integer
    readonly globalMapURL: URL
    readonly chunks: Map<integer, ChunkDescription>

    constructor(
        mapWidth: integer,
        mapHeight: integer,
        baseChunkWidth: integer,
        baseChunkHeight: integer,
        globalMapURL: URL,
        chunks: Map<integer, ChunkDescription>
    ) {
        if (mapWidth <= 0 || mapHeight <= 0 || baseChunkWidth <= 0 || baseChunkHeight <= 0) {
            throw Error("Invalid map dimension")
        }

        this.mapWidth = mapWidth
        this.mapHeight = mapHeight
        this.baseChunkWidth = baseChunkWidth
        this.baseChunkHeight = baseChunkHeight
        this.globalMapURL = globalMapURL
        this.chunks = chunks
    }

    static fromJSON(json: ChunkManifestJSON): ChunkManifest {
        let url = new URL(json.globalMapURL)
        let chunksDict = new Map<integer, ChunkDescription>()
        Object.keys(json.chunks).map((key) => {
            let intKey = parseInt(key)
            if (isNaN(intKey)) {
                throw new Error("Chunk id is not an integer")
            }
            let jsonChunkDescription = json.chunks[intKey]
            let chunkDescription = new ChunkDescription(
                new URL(jsonChunkDescription.relativeURL),
                jsonChunkDescription.x,
                jsonChunkDescription.y,
                jsonChunkDescription.width,
                jsonChunkDescription.height
            )
            chunksDict.set(intKey, chunkDescription)
        })
        return new ChunkManifest(
            json.mapWidth,
            json.mapHeight,
            json.baseChunkWidth,
            json.baseChunkHeight,
            url,
            chunksDict
        )
    }
    
    private chunkIndexAt(x: integer, y: integer): integer {
        let hCount = Math.ceil(this.mapWidth / this.baseChunkWidth)
        let vCount = Math.ceil(this.mapHeight / this.baseChunkHeight)
        let xIndex = Math.floor(x / hCount)
        let yIndex = Math.floor(y / vCount)
        return yIndex * hCount + xIndex
    }

    chunksIndicesFromCamera(camera: Phaser.Cameras.Scene2D.Camera): Set<integer> {
        let wv = camera.worldView
        return this.chunksIndicesFromBounds(wv.top, wv.left, wv.right, wv.bottom)
    }

    chunksIndicesFromBounds(top: number, left: number, right: number, bottom: number): Set<integer> {
        // Add margins so that we load chunks a bit outside of the screen
        top -= this.baseChunkHeight
        bottom += this.baseChunkHeight
        left -= this.baseChunkWidth
        right += this.baseChunkWidth

        let topLeftPoint: {x: integer, y: integer} = {
            x: Math.floor(left),
            y: Math.floor(top)
        }

        let topRightPoint: {x: integer, y: integer} = {
            x: Math.floor(right),
            y: Math.floor(top)
        }

        let bottomRightPoint: {x: integer, y: integer} = {
            x: Math.floor(right),
            y: Math.floor(bottom)
        }

        let topLeftIndex = this.chunkIndexAt(topLeftPoint.x, topLeftPoint.y)
        let topRightIndex = this.chunkIndexAt(topRightPoint.x, topRightPoint.y)
        let bottomLeftIndex = this.chunkIndexAt(bottomRightPoint.x, bottomRightPoint.y)

        // Number of tiles to be displayed on the horizontal axis
        let hDiff = topRightIndex - topLeftIndex
        
        // Number of horizontal tiles
        let hCount = Math.floor(this.mapWidth / this.baseChunkWidth)
        
        let current = topLeftIndex

        let indices = new Array<integer>()

        while (current <= bottomLeftIndex) {
            let currentCopy = current
            while (current <= currentCopy+hDiff) {
                indices.push(current)
                current += 1
            }
            current = currentCopy + hCount
        }

        return new Set(indices.filter((value, index, array) => {
            return value >= 0
        }))
    }
}