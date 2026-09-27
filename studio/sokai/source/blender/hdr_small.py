import bpy
for n in ['env_atelier','env_atelier_dawn','env_vault']:
    img=bpy.data.images.load(f'/private/tmp/claude-501/-Users-joao-Developer-HoldingCo/13b94030-a341-4300-a781-08dea5c140b3/scratchpad/out_hq/{n}.hdr')
    img.scale(768,384)
    img.file_format='HDR'
    img.filepath_raw=f'/private/tmp/claude-501/-Users-joao-Developer-HoldingCo/13b94030-a341-4300-a781-08dea5c140b3/scratchpad/out_web/{n}.hdr'
    img.save()
