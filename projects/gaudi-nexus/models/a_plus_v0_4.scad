$fn=48;
grid_angle = 44.14;
bar_len = 45;
bar_w = 10;
level0_h = 4.5;
level1_h = 3.8;
roof_rise = 1.2;
show_reference = false;

module person(x=0,y=0,z=0){
  translate([x,y,z]) {
    cylinder(h=1.35,r=0.12);
    translate([0,0,1.48]) sphere(r=0.16);
  }
}

module tree(x=0,y=0,z=0){
  translate([x,y,z]) {
    color([0.32,0.25,0.18]) cylinder(h=4.8,r1=.22,r2=.18);
    color([0.35,0.48,0.30,0.85]) translate([0,0,5.7]) sphere(r=2.2);
  }
}

module stall(x=0,y=0,z=0){
  translate([x,y,z]) {
    color([0.58,0.47,0.32]) cube([3.6,1.7,0.9],center=true);
    color([0.75,0.72,0.60]) translate([0,0,1.8]) cube([3.7,1.8,.12],center=true);
    for(xx=[-1.6,1.6]) for(yy=[-.75,.75])
      color([0.45,0.38,0.30]) translate([xx,yy,.9]) cube([.08,.08,1.8],center=true);
  }
}

module arcade_bar(service=false){
  for(x=[-20:5:20]){
    color(service?[0.64,0.62,0.57]:[0.70,0.68,0.62]) translate([x,-4.3,0]) cube([.5,.5,level0_h]);
    color(service?[0.64,0.62,0.57]:[0.70,0.68,0.62]) translate([x,3.8,0]) cube([.5,.5,level0_h]);
  }

  color([0.72,0.69,0.62]) translate([0,0,level0_h]) cube([bar_len,bar_w,.28],center=true);

  color(service?[0.55,0.54,0.51]:[0.66,0.64,0.59])
    translate([0,0,level0_h+level1_h/2+.2]) cube([bar_len-4,bar_w-2,level1_h],center=true);

  for(x=[-17.5:5:17.5])
    color([0.16,0.18,0.19])
      translate([x,-(bar_w-2)/2-.03,level0_h+level1_h/2+.2])
        cube([2.4,.08,2.2],center=true);

  for(y=[-4:1:4]){
    z = level0_h+level1_h+0.25 + roof_rise*(1-(y/4)*(y/4));
    color([0.78,0.72,0.58]) translate([0,y,z]) cube([bar_len+1,.8,.16],center=true);
  }

  if(service){
    for(x=[-15,-10,-5,0,5,10,15]) translate([x,0,0.5]) stall();
    color([0.45,0.46,0.45]) translate([-19,0,2.15]) cube([6,8.5,4.3],center=true);
  } else {
    for(x=[-12,-6,0,6,12]) translate([x,0,0.5]) stall();
  }
}

module placed_bar(cx,cy,service=false){
  translate([cx,cy,0]) rotate([0,0,grid_angle]) arcade_bar(service);
}

color([0.83,0.82,0.78]) translate([0,0,-.18]) cube([155,155,.3],center=true);

placed_bar(-50,20,true);
placed_bar(-15,50,false);

for(p=[[-26,20],[-17,28],[-7,35],[-28,40],[0,15]]) tree(p[0],p[1],0);
for(p=[[-40,10],[-32,18],[-22,26],[-5,42],[-5,54],[-12,58],[-30,45],[-1,20],[8,28]]) person(p[0],p[1],0);

if(show_reference){
  // Orientation-only mass. NOT factual Sagrada geometry.
  color([0.72,0.70,0.67,0.35]) translate([55,120,20]) rotate([0,0,44]) cube([38,55,40],center=true);
  for(x=[45,55,65])
    color([0.72,0.70,0.67,0.35]) translate([x,120,68]) cylinder(h=55,r1=4,r2=1.7,center=true);
}
