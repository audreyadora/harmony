// License: CC0 (http://creativecommons.org/publicdomain/zero/1.0/)
// draws heavily from https://madebyevan.com/shaders/fast-rounded-rectangle-shadows/ 
// webgl 2.0 implementation, uses vertex attribute instancing

export const PianoRollShaderVertex= `#version 300 es
precision highp float;

in vec2 a_position;

in vec4 v_box;
in vec4 v_color;
in vec4 v_corner;
in vec2 v_window;
in float v_sigma;

out vec2 vertex;

out vec4 f_box;
out vec4 f_color;
out vec4 f_corner;
out float f_sigma;

void main() {
  float padding = 3.0 * v_sigma;

  vertex = mix(v_box.xy - padding, v_box.zw + padding, a_position);

  f_box = v_box;
  f_color = v_color;
  f_sigma = v_sigma;
  f_corner = v_corner;

  gl_Position = vec4(vertex / v_window * 2.0 - 1.0, 0.0, 1.0);
}
`
export const PianoRollShaderFragment = `#version 300 es
precision highp float;

in vec4 f_box;
in vec4 f_color;
in vec4 f_corner;
in float f_sigma;

in vec2 vertex;

out vec4 fragColor;

// gaussian function, used for weighting samples
float gaussian(float x, float sigma) {
  const float pi = 3.141592653589793;
  return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * pi) * sigma);
}

// approximates error function, needed for gaussian integral
vec2 erf(vec2 x) {
  vec2 s = sign(x), a = abs(x);
  x = 1.0 + (0.278393 + (0.230389 + 0.078108 * (a * a)) * a) * a;
  x *= x;
  return s - s / (x * x);
}
float selectCorner(float x, float y, vec4 c) 
{
  // does this:
  // if (x < 0 && y < 0) return c.x;
  // if (x > 0 && y < 0) return c.y;
  // if (x < 0 && y > 0) return c.w;
  // if (x > 0 && y > 0) return c.z;

  float xRounded = step(0.0, x);
  float yRounded = step(0.0, y);
  return mix(mix(c.x, c.y, xRounded), mix(c.w, c.z, xRounded), yRounded);
}
// returns blurred mask along the x dimension
float roundedBoxShadowX(float x, float y, float sigma, float corner, vec2 halfSize) {
  float delta = min(halfSize.y - corner - abs(y), 0.0);
  float curved = halfSize.x - corner + sqrt(max(0.0, corner * corner - delta * delta));
  vec2 integral = 0.5 + 0.5 * erf((x + vec2(-curved, curved)) * (sqrt(0.5) / sigma));
  return integral.y - integral.x;
}

// mask for box shadow from lower to upper
float roundedBoxShadow(vec2 lower, vec2 upper, vec2 point, float sigma, float corner) {
  // center
  vec2 center = (lower + upper) * 0.5;
  vec2 halfSize = (upper - lower) * 0.5;
  point -= center;

  // samples
  float low = point.y - halfSize.y;
  float high = point.y + halfSize.y;
  float start = clamp(-3.0 * sigma, low, high);
  float end = clamp(3.0 * sigma, low, high);

  // accumulate samples 
  float step = (end - start) / 4.0;
  float y = start + step * 0.5;
  float value = 0.0;
  for (int i = 0; i < 4; i++) {
    value += roundedBoxShadowX(point.x, point.y - y, sigma, corner, halfSize) * gaussian(y, sigma) * step;
    y += step;
  }

  return value;
}

void main() {

  fragColor = vec4(f_color.rgb, f_color.a * roundedBoxShadow(f_box.xy, f_box.zw, vertex, f_sigma, f_corner.x));
}
`

export const dashedBoxShader = `
uniform sampler2D dash_atlas;
uniform float dash_index, dash_phase, dash_period;
uniform float linelength, linewidth, antialias;
uniform vec2 caps, texcoord;
uniform vec4 color;
int main() {
    float w = linewidth;
    float freq = w*dash_period;
    float u = texcoord.x;
    float v = texcoord.y;
    float u_ = mod( u + w*dash_phase, freq );
    vec4 dash = texture2D(dash_atlas, vec2(u_/freq, dash_index));
    float dash_ref = dash.x;
    float dash_type = dash.y;
    float dash_start = (u - u_) + w * dash.z;
    float dash_stop = (u - u_) + w * dash.w;
    float line_start = 0.0;
    float line_stop = linelength;
    bool cross_start = (dash_start <= line_start) && (dash_stop >= line_start);
    bool cross_stop = (dash_stop >= line_stop) && (dash_start <= line_stop);
    float t = linewidth/2.0 - antialias;
    // Default distance to the line body (7)
    float d = abs(v);

    // Dash stop is before line start
    if( dash_stop <= line_start )
        discard;
    // Dash start is beyond line stop
    else if( dash_start >= line_stop )
        discard;
    // Dash is across line start and fragment before line start (1)
    else if( (u <= line_start) && (cross_start) ) 
        d = cap( caps.x, u, v, t);
    // Dash is across line stop and fragment after line stop (4)
    else if( (u >= line_stop) && (cross_stop) )
        d = cap( caps.y, u - line_stop, v, t );
    // Dash cap start (5)
    else if( dash_type < 0.0 )
        d = cap( caps.y, u-dash_ref, v, t );
    // Dash cap stop (6)
    else if( dash_type > 0.0 )
        d = cap( caps.x, dash_ref-u, v, t );
    // Antialias test
    d -= t;
    if( d < 0.0 ) {
    gl_FragColor = color;
    } else {
    d /= antialias;
    gl_FragColor = vec4(color.rgb, exp(-d*d)*color.a);
    }
    }
`