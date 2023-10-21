attribute lowp vec2 aVertexPosition;
attribute lowp float aPower;

varying lowp float vPower;

uniform lowp vec2 iResolution;
uniform lowp mat3 iCameraMatrix;

void main() {
  lowp vec3 vertexPosition =
      vec3(aVertexPosition.x, log2(aVertexPosition.y), 0);
  lowp vec3 position = iCameraMatrix * vertexPosition;
  gl_Position = vec4(position.xy, 0, 1);
  vPower = aPower;
}
