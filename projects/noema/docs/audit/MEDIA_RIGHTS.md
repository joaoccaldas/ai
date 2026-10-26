# Reference image rights

Checked 2026-10-26. These images orient a reader. They are not evidence for a catalog claim, a date, or a historical relationship. Every rendered image keeps a caption, a license line, and a not-evidence line.

## What may render

- A file under `site/media/` that this note names, or
- an `https://upload.wikimedia.org/` URL copied from `data/reference/media-reviewed-v1.json`, or
- a Cleveland Museum of Art Open Access URL (`openaccess-cdn.clevelandart.org`) whose stored `rights` is `CC0` or `PUBLIC_DOMAIN`.

Art Institute of Chicago IIIF URLs (`artic.edu`) returned HTTP 403 from this environment. Pages do not hotlink them. The artwork page URL may still appear as a text locator in the source list, because that locator is stored on the museum record.

## Local display file

| Field | Value |
| --- | --- |
| Local path | `projects/noema/site/media/odin-gehrts-1888.jpg` |
| Pixels | 480 × 732, JPEG display derivative of the Commons 960px thumbnail |
| Subject | Johannes Gehrts, *Odin on his throne with ravens and wolves*, 1888 |
| Source file | https://commons.wikimedia.org/wiki/File:Odhin.png |
| Image URL used to make the derivative | https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Odhin.png/960px-Odhin.png |
| Record | `MEDIA-ODIN-GEHRTS-001` in `data/reference/media-reviewed-v1.json` |
| License stored on that record | Public domain / Public Domain Mark 1.0 |
| `media_class` | `MODERN_HISTORICAL_INTERPRETATION` |
| `evidence_status` | `REFERENCE_ONLY_NOT_EVIDENCE` |

The plate is a 19th-century illustration. The journey caption repeats the stored description: it is not an ancient depiction and not evidence for Viking-period iconography.

## Other reviewed files, not vendored

These stay remote. They render only on a journey or Explore row whose entity id matches the record.

| Record | License stored | URL policy |
| --- | --- | --- |
| `MEDIA-ZEUS-HYPSISTOS-DION-001` | Public domain | Wikimedia Commons thumbnail in `media-reviewed-v1.json` |
| `MEDIA-OSIRIS-LOUVRE-001` | CC0 1.0 | Wikimedia Commons thumbnail in `media-reviewed-v1.json` |

## Museum records

`site/museum-reference-media.json` holds Cleveland CC0 objects and Art Institute public-domain records. Cleveland `image_url` values (the `_web.jpg` files) may render with the stored `NOT_EVIDENCE` line. Art Institute `image_url` values do not render. `thumbnail_url` on Cleveland rows points at the larger `_print.jpg` and is not used for these phone thumbnails.
