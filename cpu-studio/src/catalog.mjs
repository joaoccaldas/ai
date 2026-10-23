/**
 * CPU Studio hardware encyclopedia, authored with historically plausible configurations.
 * Each machine represents a specific teaching configuration, not every possible period PC.
 * Original generic labels avoid trade dress and trademarked product images.
 * Refer to docs/historical-sources.md for claims and simplification boundaries.
 */
export const ERAS = Object.freeze([
  { year: 1975, name: 'THE KIT ERA', subtitle: 'A desk. A circuit. A revolution.', location: 'A garage in Albuquerque', theme: 'kit', technology: 'Intel 8080-class kit · S-100 expansion bus', icon: '✦' },
  { year: 1981, name: 'THE PC ERA', subtitle: 'Computers come home.', location: 'A bedroom in 1981', theme: 'pc', technology: '8088 CPU · floppy disks · character display', icon: '▣' },
  { year: 1995, name: 'MULTIMEDIA', subtitle: 'Color, sound, and a whole new world.', location: 'A family desk in 1995', theme: 'desktop', technology: 'Pentium-class CPU · EDO RAM · IDE hard drive', icon: '◉' },
  { year: 2005, name: 'LAN PARTY', subtitle: 'Build it. Connect it. Play together.', location: 'A late-night gaming den', theme: 'lan', technology: 'Athlon 64-class CPU · DDR · PCIe graphics', icon: '⌘' },
  { year: 2026, name: 'CREATOR LAB', subtitle: 'The whole world fits on your desk.', location: 'A creator studio today', theme: 'modern', technology: 'AM5 · DDR5 · NVMe · modern GPUs', icon: '✧' },
]);

export const ITEMS = Object.freeze([
  { id: 's100-cpu', name: '8080 CPU board', slot: 'cpu', era: 0, price: 24, spec: '8-bit · S-100 kit', teaches: 'The processor fetches, decodes, and executes instructions. This kit places the CPU on a plug-in board.' },
  { id: 's100-256', name: '256-byte RAM', slot: 'ram', era: 0, price: 12, spec: '256 bytes · S-100', teaches: 'RAM holds temporary working information. The original Altair kit shipped with just 256 bytes.' },
  { id: 's100-1k', name: '1 KB memory board', slot: 'ram', era: 0, price: 35, spec: '1,024 bytes · S-100', teaches: 'More RAM can hold more instructions and data, but the CPU must still address it.' },
  { id: 'switch-panel', name: 'Switch & LED panel', slot: 'io', era: 0, price: 20, spec: 'Manual input · status lights', teaches: 'Early home computer hobbyists entered machine code using front-panel switches and read results from lamps. A monitor and floppy were not required.' },
  { id: '8088', name: '8088 processor', slot: 'cpu', era: 1, price: 38, spec: '16-bit core · 8-bit bus', teaches: 'The 8088 has a 16-bit internal architecture and an 8-bit external data bus, a pragmatic choice for early PCs.' },
  { id: 'pc-64k', name: '64 KB RAM board', slot: 'ram', era: 1, price: 40, spec: '64 KB · early PC board', teaches: 'The original 1981 IBM PC could be configured with 16 KB RAM; 64 KB is a valid early PC configuration.' },
  { id: 'floppy-525', name: '5¼-inch boot disk', slot: 'storage', era: 1, price: 50, spec: 'Bootable 5¼-inch floppy', teaches: 'A floppy disk can hold programs and a bootable operating system; the computer reads it through a matching disk drive.' },
  { id: 'cga', name: 'Color graphics card', slot: 'video', era: 1, price: 55, spec: 'CGA · expansion card', teaches: 'A display adapter converts computer data into video signals. Color required a compatible card and monitor.' },
  { id: 'pentium-133', name: '133 MHz processor', slot: 'cpu', era: 2, price: 75, spec: 'Pentium-class · Socket 7', teaches: 'By 1995, mainstream PCs used much faster processors. Socket 7 era chips do not fit modern AM5 motherboards.' },
  { id: 'edo-8', name: '8 MB EDO RAM', slot: 'ram', era: 2, price: 65, spec: '72-pin SIMM · EDO', teaches: 'EDO SIMM is an older physical form of RAM. Memory type and motherboard slot must match.' },
  { id: 'edo-16', name: '16 MB EDO RAM', slot: 'ram', era: 2, price: 95, spec: '72-pin SIMM · EDO', teaches: 'Upgrading from 8 MB to 16 MB allows more software data to remain in memory.' },
  { id: 'ide-hdd', name: 'IDE hard drive', slot: 'storage', era: 2, price: 70, spec: '540 MB · parallel ATA', teaches: 'Unlike a floppy, a fixed hard drive holds more data and typically remains installed inside the computer.' },
  { id: 'vga', name: 'VGA video card', slot: 'video', era: 2, price: 85, spec: 'PCI · 2D graphics', teaches: 'The video adapter drives the monitor. Separate cards were common in 1990s desktops.' },
  { id: 'sound-isa', name: 'Sound card', slot: 'audio', era: 2, price: 45, spec: '16-bit ISA audio', teaches: 'In many 1990s PCs, an expansion card supplied audio capabilities.' },
  { id: 'athlon-939', name: '64-bit processor', slot: 'cpu', era: 3, price: 105, spec: 'Athlon 64-class · Socket 939', teaches: 'The socket must match the motherboard. Socket 939 systems used DDR memory, not DDR2.' },
  { id: 'ddr-1g', name: '1 GB DDR RAM', slot: 'ram', era: 3, price: 85, spec: 'DDR-400 · 184-pin DIMM', teaches: 'DDR and DDR2 memory are physically different. They cannot simply be interchanged.' },
  { id: 'ddr2-512', name: '512 MB DDR2 RAM', slot: 'ram', era: 3, price: 40, spec: 'DDR2 · incompatible decoy', teaches: 'DDR2 uses a different slot and signaling. It is NOT supported by this Socket 939 DDR motherboard.', decoy: true },
  { id: 'sata-hdd', name: '80 GB SATA drive', slot: 'storage', era: 3, price: 70, spec: 'SATA · magnetic drive', teaches: 'SATA replaced bulky parallel data ribbons with narrower serial data cables.' },
  { id: 'pcie-6600', name: 'PCIe graphics card', slot: 'video', era: 3, price: 120, spec: 'PCI Express · 2005 class', teaches: 'The GPU renders complex images. PCI Express became a modern, high-bandwidth expansion connection.' },
  { id: 'eth-pci', name: 'Network adapter', slot: 'network', era: 3, price: 45, spec: 'Ethernet · PCI', teaches: 'Network adapters let computers send data to other machines over a local network.' },
  { id: 'ryzen-7600', name: '6-core AM5 CPU', slot: 'cpu', era: 4, price: 135, spec: 'x86-64 · AM5 · integrated graphics', teaches: 'An AM5 Ryzen 5 7600 supports DDR5 and includes integrated graphics, so a separate GPU is not always needed just to display a screen.' },
  { id: 'ddr5-16', name: '16 GB DDR5', slot: 'ram', era: 4, price: 95, spec: 'DDR5 DIMM · AM5 compatible', teaches: 'DDR5 supplies fast volatile working memory. It is not interchangeable with older DDR generations.' },
  { id: 'ddr5-32', name: '32 GB DDR5', slot: 'ram', era: 4, price: 155, spec: 'DDR5 DIMM · dual channel kit', teaches: 'More RAM helps heavy workloads when working sets exceed smaller memory capacity.' },
  { id: 'nvme-512', name: '512 GB NVMe SSD', slot: 'storage', era: 4, price: 105, spec: 'M.2 NVMe · PCIe', teaches: 'NVMe SSDs transfer data over PCI Express; they are not identical to older SATA hard drives.' },
  { id: 'am5-cooler', name: 'AM5 CPU cooler', slot: 'cooler', era: 4, price: 48, spec: 'Thermal paste + heatsink', teaches: 'Heat must move from CPU into the cooler, usually through thermal interface material.' },
  { id: 'psu-650', name: '650 W power supply', slot: 'power', era: 4, price: 120, spec: 'ATX PSU · connectors', teaches: 'The PSU converts mains AC power into regulated low-voltage DC rails and feeds the motherboard, CPU and GPU through appropriate cables.' },
  { id: 'gpu-modern', name: 'Creator GPU', slot: 'video', era: 4, price: 160, spec: 'PCIe x16 · graphics + compute', teaches: 'A discrete GPU accelerates graphics and some parallel workloads; software and driver support still matter.' },
]);
export const ITEM_BY_ID = Object.freeze(Object.assign(Object.create(null),Object.fromEntries(ITEMS.map(i=>[i.id,i]))));
export const SLOT_LABELS = Object.freeze({cpu:'PROCESSOR',ram:'MEMORY',io:'FRONT PANEL',storage:'STORAGE',video:'GRAPHICS',audio:'SOUND',network:'NETWORK',cooler:'COOLING',power:'POWER SUPPLY'});

const level = (id, era, title, subtitle, goal, req, buy, reward, xp, lesson, fact, card) => Object.freeze({id,era,title,subtitle,goal,required:Object.freeze(req),buy,reward,xp,lesson,fact,card});
export const LEVELS = Object.freeze([
  level(1,0,'The first spark','1975 · hobbyist garage','Power a computer using switches and status lights.',{cpu:'s100-cpu',ram:'s100-256',io:'switch-panel'},null,65,45,'A working computer needs a CPU, memory, and a way to interact with it. The panel is the interface.','In 1975, early Altair machines had switches and LEDs rather than built-in video screens.','The First Spark'),
  level(2,0,'One kilobyte!','1975 · the upgrade','Give your kit more memory to run a longer program.',{cpu:'s100-cpu',ram:'s100-1k',io:'switch-panel'},'s100-1k',90,60,'256 bytes and 1,024 bytes are very different amounts of workspace. 1 KB = 1,024 bytes.','S-100 expansion boards made kit computers extensible.','Memory Pioneer'),
  level(3,1,'The PC arrives','1981 · personal computing','Build a home PC and start it from a floppy disk.',{cpu:'8088',ram:'pc-64k',storage:'floppy-525'},'floppy-525',120,80,'This 1981-style PC has an 8088, 64 KB RAM, and a 5¼-inch bootable disk.','The original IBM PC launched in 1981; some configurations started with 16 KB RAM.','Personal Computing'),
  level(4,1,'Life in color','1981 · display upgrade','Add a color-capable video card to your home PC.',{cpu:'8088',ram:'pc-64k',storage:'floppy-525',video:'cga'},'cga',135,85,'The processor computes; a compatible video adapter and display make the result visible.','Color graphics were an expansion choice, not a universal default.','Color Discoverer'),
  level(5,2,'Windows and games','1995 · family desk','Assemble a Pentium-era PC with video and a hard drive.',{cpu:'pentium-133',ram:'edo-8',storage:'ide-hdd',video:'vga'},'vga',165,105,'The 1990s brought big improvements in processors, memory, storage and graphics. The same pieces now use very different interfaces.','Intel introduced its 133 MHz Pentium in June 1995.','Desktop Explorer'),
  level(6,2,'Make some noise','1995 · multimedia desk','Upgrade memory and add a sound card.',{cpu:'pentium-133',ram:'edo-16',storage:'ide-hdd',video:'vga',audio:'sound-isa'},'edo-16',185,110,'A sound card handles audio; upgrading RAM gives demanding software more workspace.','Dedicated ISA sound cards were common accessories for multimedia PCs.','Audio Explorer'),
  level(7,3,'The LAN party','2005 · gaming den','Add PCIe graphics and build a powerful gaming machine.',{cpu:'athlon-939',ram:'ddr-1g',storage:'sata-hdd',video:'pcie-6600'},'pcie-6600',225,135,'Modern games often depend on dedicated GPUs, matched RAM and fast communication between parts.','Socket 939 Athlon 64 systems used first-generation DDR RAM.','Pixel Racer'),
  level(8,3,'Wrong memory!','2005 · repair shop','Repair a machine and learn why DDR2 cannot fit DDR slots.',{cpu:'athlon-939',ram:'ddr-1g',storage:'sata-hdd',video:'pcie-6600',network:'eth-pci'},'sata-hdd',250,150,'A computer can contain individually good parts that simply cannot work together. Check socket, electrical signaling and physical connectors.','The incompatible DDR2 card is a teaching decoy; Socket 939 supports DDR, not DDR2.','Compatibility Expert'),
  level(9,4,'Build for creators','2026 · creator lab','Assemble a modern machine, including power and cooling.',{cpu:'ryzen-7600',ram:'ddr5-16',storage:'nvme-512',cooler:'am5-cooler',power:'psu-650'},'psu-650',290,180,'Power, cooling, compatible CPU and RAM, and bootable storage matter. The chosen CPU has basic integrated graphics.','The Ryzen 5 7600 supports the AM5 socket, DDR5, NVMe boot and integrated Radeon graphics.','Creator Workstation'),
  level(10,4,'The ultimate build','2026 · creative studio','Upgrade to 32 GB memory and a discrete creator GPU.',{cpu:'ryzen-7600',ram:'ddr5-32',storage:'nvme-512',cooler:'am5-cooler',power:'psu-650',video:'gpu-modern'},'ddr5-32',400,240,'A capable workstation balances compute, memory, power, cooling and graphics. More is not always faster unless software uses it.','A discrete GPU is an upgrade for heavier graphics and compute tasks, not automatically necessary to boot with this CPU.','Master Builder'),
]);

export const TRADES = Object.freeze([
  { id:'swap-1',give:'s100-256',receive:'poster-kit',title:'Museum Archivist',description:'Trade an extra 256-byte board for a collectible 1975 lab poster.',era:0 },
  { id:'swap-2',give:'floppy-525',receive:'poster-pc',title:'Retro Collector',description:'Trade a spare floppy for an early PC blueprint card.',era:1 },
  { id:'swap-3',give:'sata-hdd',receive:'poster-lan',title:'LAN Museum',description:'Trade a spare SATA drive for a vintage LAN-party poster.',era:3 },
]);
export const COLLECTIBLES = Object.freeze([
  {id:'poster-kit',name:'Homebrew Poster',year:1975,rarity:'Archival',description:'A technical poster of a switch-and-light computer kit.'},
  {id:'poster-pc',name:'PC Schematic',year:1981,rarity:'Archival',description:'An annotated early personal-computer blueprint.'},
  {id:'poster-lan',name:'LAN Flyer',year:2005,rarity:'Archival',description:'A colorful memento of game nights before Wi-Fi was everywhere.'},
]);
export const DAILY_QUESTS = Object.freeze([
  {question:'Which component executes the computer’s instructions?',options:['CPU','RAM','Storage'],answer:0,explain:'The CPU fetches, decodes and executes instructions.'},
  {question:'Why can’t DDR2 replace DDR in a Socket 939 PC?',options:['Different connector and signaling','Too much storage','It needs an Internet connection'],answer:0,explain:'DDR and DDR2 use different physical keyed slots and electrical signals.'},
  {question:'How did an original 1975 kit computer receive input?',options:['Front-panel switches','A touch screen','Bluetooth'],answer:0,explain:'Early Altair kits used switches for input and lights for output.'},
  {question:'Which part retains files when the computer is switched off?',options:['RAM','An SSD or hard drive','CPU registers'],answer:1,explain:'Storage is non-volatile. Ordinary RAM loses its contents without power.'},
  {question:'Does every modern desktop CPU need a separate GPU to display an image?',options:['Always','No, some have integrated graphics','A floppy is required'],answer:1,explain:'Some processors, including the Ryzen 5 7600, offer integrated graphics.'},
]);
