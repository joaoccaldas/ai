#!/usr/bin/env python3
"""Asset Library V1 contract.

The current binary GLBs were generated outside Git in the execution environment.
This script stores the authoritative asset definitions so the library can be
rebuilt later in Blender or another geometry runtime without reverse-engineering
the GLBs.
"""

ASSETS = [
    ("stall_standard","market"),
    ("stall_accessible","market"),
    ("produce_crate","market"),
    ("refrigerated_display","market"),
    ("dry_storage_cabinet","service"),
    ("waste_sorting_station","service"),
    ("handwash_station","service"),
    ("service_cart","operations"),
    ("community_table","civic"),
    ("civic_bench","civic"),
    ("tree_grate_small","landscape"),
    ("low_planter","landscape"),
    ("drinking_fountain","public_realm"),
    ("public_bin","public_realm"),
    ("bike_rack_5","public_realm"),
    ("bollard","public_realm"),
    ("wayfinding_totem","wayfinding"),
    ("market_sign_blade","wayfinding"),
    ("lighting_pole","lighting"),
    ("queue_rail","operations"),
    ("solar_fin_module","envelope"),
    ("gutter_downpipe_module","rainwater"),
    ("tactile_tile","accessibility"),
    ("paving_module","ground"),
    ("floor_drain_channel","service"),
    ("mep_rail","services"),
    ("acoustic_baffle","acoustics"),
]

if __name__ == "__main__":
    print(f"{len(ASSETS)} asset contracts")
    for name, category in ASSETS:
        print(f"- {name}: {category}")
