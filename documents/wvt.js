//VERSION=3
function setup() {
   return {
    input: ["B02", "B03", "B04", "B08", "B11", "B12", "dataMask"],
    output: { bands: 6 }
  };
}
function evaluatePixel(samples) {
HK=-2.5*Math.log10(samples.B11/samples.B12);
IH=-2.5*Math.log10(samples.B08/samples.B11);
RI=-2.5*Math.log10(samples.B04/samples.B08);
GR=-2.5*Math.log10(samples.B03/samples.B04);
BG=-2.5*Math.log10(samples.B02/samples.B03);
//australia : cr=2.0 , cg=0.5 , cb=0.3
//asia      : cr=0.75, cg=0.5 , cb=0.75
//elsewhere : cr=0.5 , cg=0.5 , cb=0.5
cr=0.5;
cg=0.5;
cb=0.5;
kr=2.5;
kg=2.5;
kb=2.5;
var R = samples.B04*kr  + cr*Math.max(0, HK); // enhance thermal emission
var G = samples.B03*kg  + cg*Math.max(0, RI); // enhance vegetation
var B = samples.B02*kb  + cb*Math.max(0, BG); // enhance water
return [R, G, B, samples.dataMask];
}


/*
"Selective Enhancement based on Indices"
Interactive enhancement masks for alernate selection of Land x Water/Snow/Vegetation, based on NDWI, NDSI and NDVI Indices, for Sentinel-2 
(see Indices at  https://custom-scripts.sentinel-hub.com/#sentinel-2)
By io A. J. Volkmer (https://twitter.com/sergioajv1) * CC BY 4.0 International - https://creativecommons.org/licenses/by/4.0/
References: 
Selective treatment logics based on Simon Gascoin's "Better snow visualisation using NDSI" - https://www.sentinel-hub.com/contest
Enhancement functions based on Pierre Markuse's "Wildfire visualization" - https://custom-scripts.sentinel-hub.com/sentinel-2/markuse_fire/
NOTES for begginers (author too): Try to change values a bit to fit better for different situations; see comments after "//" if it helps. 
*/
// ENHANCEMENT FUNCTIONS:
function a(a, b) {return a + b};
// FUNCTION FOR CONTRAST:
function stretch(val, min, max) {return (val - min) / (max - min);} 
// FUNCTION FOR SATURATION (for Verse and Inverse, separately):
function satEnh_V(rgbArr) {
    var avg = rgbArr.reduce((a, b) => a + b, 0) / rgbArr.length;
    return rgbArr.map(a => avg * (1 - SATU_V) + a * SATU_V); }	
function satEnh_I(rgbArr) {
    var avg = rgbArr.reduce((a, b) => a + b, 0) / rgbArr.length;
    return rgbArr.map(a => avg * (1 - SATU_I) + a * SATU_I); } 
// FUNCTION CONTRAST + SATURATION (for Verse and Inverse, separately):
function applyEnh_V(bArr) {
	return satEnh_V([stretch(bArr[0], SminV, SmaxV), stretch(bArr[1], SminV, SmaxV), stretch(bArr[2], SminV, SmaxV)]); }
function applyEnh_I(bArr) {
	return satEnh_I([stretch(bArr[0], SminI, SmaxI), stretch(bArr[1], SminI, SmaxI), stretch(bArr[2], SminI, SmaxI)]); }
//==============================================================================
// *SETTINGS HERE*: Select adjustments (for Verse and Inverse, separately):
// STRETCH CONTRAST (min/max: Shadow/Light; default=0.00/1.00; blackout-mask = 1,1): // TIP: avoid too different contrast for masks
var SminV = 0.05 ; // Shadows: Darken : >0 ; Lighten <0
var SmaxV = 1.05 ; // Lights:  Darken : >1 ; Lighten <1
var SminI = 0.05 ; // Shadows: Darken : >0 ; Lighten <0
var SmaxI = 1.05 ; // Lights:  Darken : >1 ; Lighten <1
// SATURATION:
var SATU_V = 1.10 ; // standard=1.00; monochromatic=0; 2x=2.00
var SATU_I = 1.10 ; // standard=1.00; monochromatic=0; 2x=2.00
//------------------------------------------------------------------------------
// INDEX: choose "only one" as SELECTION MASK (activate it removing first comment out "//"; default=NDWI2):
//var NDSI = (B03-B11)/(B03+B11);  // Discriminates WATER&SNOW x NON-WATER: standard SNOW ~ > 0.42
//var NDVI = (B08-B04)/(B08+B04);  // Discriminates VEGETATION x NON-VEG: ~ Water<0 Soil,Sand,Snow,Clouds=-.1,+.1 LowVeg=.2,.4 DenseVeg>.4
var NDWI2 = (B03-B08)/(B03+B08); // Discriminates WATER x NON-WATER: standard WATER limit ~ > 0.3
//------------------------------------------------------------------------------
// BAND COMPOSTIONS: [RED, GREEN, BLUE]; (more customised compostions can be added to list below) // Enhancement description:
// Proposed for VERSE MASK (Water/NDWI, Vegetation/NDVI, Snow/NDSI):
var NATURAL_REDGE = [(B04*4.0), (B03*2.8+B06*1.5), (B02*3.5)]; // Near Natural; turbidity and algae RedEdge
var FALSECOLOR_NIR = [(B08*2.3), (B03*1.0+B05*2.0), (B02*3.5)]; // Bluish water NIR; algae RedEdge
// Proposed for INVERSE MASK (LAND):
var NATURAL_NIR = [(B04*3.0+B05*1.0), (B03*3.0+B08*1.0), (B02*3.5)] ; // Near Natural; Vegetation NIR 
var NATURAL_SWIR = [(B04*2.6+B12*0.8), (B03*3.0+B08*0.5), (B02*3.0)] ; // Bare soil SWIR; Vegetation NIR
var GEOLOGY_SWIR = [(B12*2.2), (B04*1.4+B08*1.0), (B02*2.5)] ; // Geology SWIR; Vegetation NIR
//------------------------------------------------------------------------------
// SET BAND COMPOSTIONS (for each mask; may use same COMPO for both, or switch each other, according to necessity): 
var MaskVERSE   = FALSECOLOR_NIR ; // Copy composition here
var MaskINVERSE = GEOLOGY_SWIR ;  // Copy composition here
//------------------------------------------------------------------------------
var EnhVERSE   = applyEnh_V(MaskVERSE)  ; // Don't change this
var EnhINVERSE = applyEnh_I(MaskINVERSE); // Don't change this
//------------------------------------------------------------------------------
// RETURNs on screen selected ENHANCEMENT, according to INDEXES from above and its limit values below (use "only one" below; default NDWI2):
//return ( NDSI > 0.42 ) ? EnhVERSE : EnhINVERSE ; // For SNOWY areas only
//return ( NDVI > 0.4 ) ? EnhVERSE : EnhINVERSE ; // For VEGETATION areas only
return ( NDWI2 > -0.1 ) ? EnhVERSE : EnhINVERSE ; // LAND x WATER: limit lowered to take clouds w/ water
//


//VERSION=3

/*
Perceptually-Uniform Colormap Kit
author: Keenan Ganz (ganzk at rpi dot edu)
September 2020
*/

/*
Reference white values for D65 illuminant,
secondary observer.
*/
var REF_X = 95.0489
var REF_Y = 100.0
var REF_Z = 108.8840

function percent_between(min, max, x){
  return (x - min) / (max - min)
}

function clip(min, max, x) {
  return Math.min(max, Math.max(min, x))
}

function rgb2lab(rgb) {
  /*
  Convert rgb coordinates to CIELAB coordinates via XYZ. 
  Expects normalized RGB values.

  Arithmetic from easyrgb.com
  */
  let [r, g, b] = rgb

  function to_linear(val) {
    if (val > 0.04045)
      return Math.pow((val + 0.055) / 1.055, 2.4)
    else
      return val / 12.92
  }

  let r_lin = to_linear(r) * 100
  let g_lin = to_linear(g) * 100
  let b_lin = to_linear(b) * 100

  let x = r_lin * 0.4124 + g_lin * 0.3576 + b_lin * 0.1805
  let y = r_lin * 0.2126 + g_lin * 0.7152 + b_lin * 0.0722
  let z = r_lin * 0.0193 + g_lin * 0.1192 + b_lin * 0.9505

  let x_std = x / REF_X
  let y_std = y / REF_Y
  let z_std = z / REF_Z

  function std_prep(val) {
    if (val > 0.008856)
      return Math.pow(val, 1.0 / 3.0)
    else
      return val * 7.787 + (16.0 / 116.0)
  }
  let L = 116.0 * (std_prep(y_std) - 16.0 / 116.0)
  let a = 500.0 * (std_prep(x_std) - std_prep(y_std))
  b = 200.0 * (std_prep(y_std) - std_prep(z_std))

  return [L, a, b]
}

function lab2rgb(Lab) {
  /*
  Convert CIELAB coordinates to RGB coordinates.

  Arithmetic from easyrgb.com
  */
  let [L, a, b] = Lab
  let var_y = (L + 16.0) / 116.0
  let var_x = (a / 500.0) + var_y
  let var_z = var_y - (b / 200.0)

  function undo_std_prep(val) {
    if (Math.pow(val, 3.0) > 0.008856)
      return Math.pow(val, 3.0)
    else
      return (val - (16.0 / 116.0)) / 7.787
  }
  var_y = undo_std_prep(var_y)
  var_x = undo_std_prep(var_x)
  var_z = undo_std_prep(var_z)

  let x = var_x * REF_X / 100
  let y = var_y * REF_Y / 100
  let z = var_z * REF_Z / 100

  let var_r = x * 3.2406 + y * -1.5372 + z * -0.4986
  let var_g = x * -0.9689 + y * 1.8758 + z * 0.0415
  let var_b = x * 0.0557 + y * -0.2040 + z * 1.0570

  function undo_linear(val) {
    if (val > 0.0031308)
      return 1.055 * Math.pow(val, (1.0 / 2.4)) - 0.055
    else
      return val * 12.92
  }

  let r = Math.max(undo_linear(var_r), 0)
  let g = Math.max(undo_linear(var_g), 0)
  b = Math.max(undo_linear(var_b), 0)

  // mapping isn't perfect, constrain to [0, 1]
  return [clip(0, 1, r), clip(0, 1, g), clip(0, 1, b)]
}

class Colormap {
  /*
  Base class for making perceptually uniform color maps. Using this class on its own
  simply maps RGB coordinates to LAB space and linearly interpolates inbetween values.

  Use SequentialColorMap, DivergentColorMap, etc. for more specific use cases.
  */
  constructor(color_anchors, data_anchors, remap=true, uniform=false) {
    if (color_anchors.length < 1)
      throw "ColorMap requires at least one color."
    if (color_anchors.length != data_anchors.length)
      throw "Color and data anchors must be of same length."
    // verify that the data array is sorted low to high
    for (let i = 1; i < data_anchors.length; i++) {
      if (data_anchors[i] < data_anchors[i - 1])
        throw "Data anchors array must be sorted."
    }
    // map incoming rgb coordinates into LAB space
    this.data_anchors = data_anchors
    if (remap) this.color_anchors = color_anchors.map(rgb2lab)
    else this.color_anchors = color_anchors
    // do the lightness correction, if desired, and then check
    // if the correction moved colors outside of RGB space
    if (uniform) {
      this._lightness_correction()
      for (let i = 0; i < this.color_anchors.length; i++){
        let rgb = lab2rgb(this.color_anchors[i])
        for (let j = 0; j < rgb.length; j++){
          if (rgb[i] < 0 || rgb[i] > 1)
            throw "After lightness correction, colors are out of RGB space!"
        }
      }
    } 
  }

  _lightness_correction() {return}

  get_color(data_value) {
    // return edge values if data value is oob
    if (data_value <= this.data_anchors[0])
      return lab2rgb(this.color_anchors[0])
    else if (data_value >= this.data_anchors[this.data_anchors.length - 1])
      return lab2rgb(this.color_anchors[this.color_anchors.length-1])

    return lab2rgb(colorBlend(data_value, this.data_anchors, this.color_anchors))
  }
}

class LinearColormap extends Colormap {
  /*
  Simple linear ramp color map class. Set uniform to true
  in the constructor to enforce constant lightness.
  */
  constructor(color_anchors, data_anchors, uniform=true) {
    super(color_anchors, data_anchors, true, uniform)
  }

  _lightness_correction() {
    // get overall change in lightness
    let L0 = this.color_anchors[0][0]
    let Lp = this.color_anchors[this.color_anchors.length-1][0]
    let dL = Lp - L0

    // make the lightness values monotonically change
    for (let i = 1; i < this.color_anchors.length - 1; i++) {
      let percent_interval = percent_between(
        this.data_anchors[this.data_anchors.length - 1],
        this.data_anchors[0],
        this.data_anchors[i]
      )
      this.color_anchors[i][0] = L0 + (dL * percent_interval)
    }
  }
}

var map = [
  [189/255, 230/255, 237/255],
  [78/255, 121/255, 153/255],
  [0, 0, 50/255],
  [17/255, 150/255, 14/255],
]

var data = [0.2, 0.5, 0.7, 0.9] 

var cmap = new LinearColormap(map, data, false);

function setup() {
  return {
   input: ["B02", "B03", "B04", "B08", "B11", "B12", "dataMask"],
    output: {
      bands: 3
    }
  };
}

function trueColor(sample){
  return [sample.B04 * 2.5, sample.B03 * 2.5, sample.B02 * 2.5]
}

function evaluatePixel(sample) {
  let ndwi = (sample.B03 - sample.B08) / (sample.B03 + sample.B08)
  let HK=-2.5*Math.log10(sample.B11/sample.B12);
  let IH=-2.5*Math.log10(sample.B08/sample.B11);
  let RI=-2.5*Math.log10(sample.B04/sample.B08);
  let GR=-2.5*Math.log10(sample.B03/sample.B04);
  let BG=-2.5*Math.log10(sample.B02/sample.B03);
  let X=IH;
  if (X > 0.2) {return cmap.get_color(X)}
  else {return trueColor(sample)}
}




