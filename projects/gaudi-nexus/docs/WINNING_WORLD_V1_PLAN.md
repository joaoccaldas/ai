# Winning World Build Plan — V1.0

## Problem
World V0.9 still reads as prototype architecture because:
- context is not authoritative;
- Sagrada geometry is a proxy;
- entourage is procedural;
- materials lack microstructure;
- lighting lacks Cycles-level global illumination;
- the world lacks dense second-order detail.

## V1.0 target
A full 3D world that can survive close inspection and directly generate:
- competition hero;
- main section;
- plan/axon;
- detail views;
- process diagrams;
- web portfolio world.

## Model hierarchy

### L0 — authoritative site
- municipal topography;
- municipal 3D context;
- Sagrada context;
- plaza;
- curbs;
- trees;
- furniture;
- access/transit.

### L1 — primary architecture
- hard market edge;
- civic edge;
- 5 m bay system;
- roof;
- structural frame;
- cores;
- glazing;
- service head.

### L2 — operational components
Use Asset Library V1.

### L3 — human detail
- traders;
- residents;
- children;
- visitors;
- bicycles;
- bags;
- produce;
- menus;
- stools;
- cleaning/maintenance objects.

### L4 — material microdetail
- tile bond;
- mortar;
- chipped/worn edges;
- mineral pores;
- timber grain;
- brushed steel;
- finger/contact roughness;
- water marks;
- drain grates;
- paving joints;
- ceramic glazing variation.

### L5 — atmosphere
- real sun;
- sky;
- contact shadow;
- indirect light;
- subtle atmospheric perspective;
- no cinematic fog used to hide weak geometry.

## Camera gate
The primary human camera must read at ~1.55 m eye height with a 28–35 mm equivalent lens.

If the architecture feels generic from this camera, architecture changes before rendering polish.

## Final-world pass criteria
1. no proxy context inside hero frame;
2. no floating/interpenetrating objects;
3. every visible component has attachment logic;
4. plan/section/render derive from same scene;
5. no PBR texture exceeds required resolution;
6. no visible repeated asset pattern;
7. no impossible human scale;
8. no fake environmental effect;
9. hero composition scores >=9/10 internally;
10. world remains interactive at acceptable mobile fallback quality.
