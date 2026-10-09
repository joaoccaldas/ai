"""Read produced pixels; never invoke a renderer or alter the output image."""
import array
import bpy


def image_health(path, max_samples=32000):
    image = bpy.data.images.load(str(path), check_existing=False)
    try:
        pixels = array.array('f',[0])*len(image.pixels)
        image.pixels.foreach_get(pixels)
        stride = max(1,len(pixels)//4//max_samples)
        values = sorted(.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2]
                        for i in range(0,len(pixels),4*stride))
        p05,p95 = values[int(.05*(len(values)-1))],values[int(.95*(len(values)-1))]
        return {'status':'PASS_PIXEL_RANGE' if p95-p05>.01 else 'FAIL_COLLAPSED_PIXEL_RANGE',
                'samples':len(values),'mean_luminance':sum(values)/len(values),
                'p05_luminance':p05,'p95_luminance':p95,'range_p05_p95':p95-p05,
                'space':'Blender loaded scene-linear RGB luminance after PNG decoding',
                'limits':'Detects black/near-uniform daylight output; not a visual-quality score.'}
    finally:
        bpy.data.images.remove(image)
