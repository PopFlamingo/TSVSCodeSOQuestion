import {ChunkManifest, ChunkDescription} from "./ChunkManager"

describe.each([
  [0, 0, 0, 0],
  [10, -1, 10, 10],
  [10, 10, -1, 10],
  [10, 10, 10, -1],
  [-1, -1, -1, -1]
])("Test invalid ChunkManifest constructor: mapWidth: %i, mapHeight: %i, chunkWidth: %i, chunkHeight: %i",
(mapWidth: integer, mapHeight: integer, chunkWidth: integer, chunkHeight: integer) => {
  let fooURL = new URL("http://www.example.org/")
  let emptyChunkMap =  new Map<integer, ChunkDescription>()
  test("Invalid map size", () => {
    expect(() => new ChunkManifest
    (
      mapWidth, mapHeight,
      chunkWidth, chunkHeight,
      fooURL,
      emptyChunkMap
    )).toThrow(Error("Invalid map dimension"))
  })
}, 5)

let fooURL = new URL("http://www.example.org/")
let emptyChunkMap =  new Map<integer, ChunkDescription>()
let map = new ChunkManifest(100, 100, 10, 10, fooURL, emptyChunkMap)
map.chunksIndicesFromBounds(0,0,0,0)