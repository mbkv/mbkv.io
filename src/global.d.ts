declare module "*.fs" {
  const fragmentShader: string;
  export default fragmentShader;
}

declare module "*.vs" {
  const vertexShader: string;
  export default vertexShader;
}
