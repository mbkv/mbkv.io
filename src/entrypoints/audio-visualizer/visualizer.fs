varying lowp float vPower;

uniform lowp vec3 iColorMin;
uniform lowp vec3 iColorMax;

void main(void) { gl_FragColor = vec4(mix(iColorMin, iColorMax, vPower), 1.0); }
