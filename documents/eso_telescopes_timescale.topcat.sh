topcat -stilts plot2plane \
   xpix=1391 ypix=817 \
   ylog=true xlabel='First \quad light' ylabel='equivalent \quad diameter \quad [m]' grid=true minor=false texttype=latex fontsize=24 \
   xmin=1965 xmax=2030 ymin=0.3 ymax=100 \
   title='ESO\quad telescopes\quad timeline' legend=true legpos=0.0,1.0 \
   in=eso_telescopes_timescale.csv ifmt=CSV x=First_light y=eqdiam xdelta=decomissioned-first_light ydelta=0 arrow=large_arrow thick=1 size=5 label=name texttype=latex fontsize=24 anchor=north \
   layer_1=XYVector \
      icmd_1='select <WL_opt>' \
      shading_1=flat color_1=cyan \
   layer_2=XYVector \
      icmd_2='select <WL_rad>' \
      shading_2=flat color_2=ff7f50 \
   layer_3=Mark \
      icmd_3='select <WL_opt>' \
      shading_3=auto color_3=blue \
      leglabel_3=optical \
   layer_4=Mark \
      icmd_4='select <WL_rad>' \
      shading_4=auto \
      leglabel_4=submm \
   layer_5=Label \
      icmd_5='select <WL_opt>' \
      color_5=blue \
   layer_6=Label \
      icmd_6='select <WL_rad>' \
   legseq=_3,_4
