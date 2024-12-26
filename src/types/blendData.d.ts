// blendshape.d.ts

export interface Blendshapes {
  [key: string]: number;
}

export interface BlendData {
  time: number;
  blendshapes: Blendshapes;
}
