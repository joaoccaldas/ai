# Reference image rights

Checked 2026-10-26. These images orient a reader. They are not evidence for a catalog claim, a date, or a historical relationship. Every rendered image keeps a caption, a license line, and a not-evidence line.

## What may render

- A file under `site/media/` that this note names, or
- an `https://upload.wikimedia.org/` URL copied from `data/reference/media-reviewed-v1.json`, or
- a Cleveland Museum of Art Open Access URL (`openaccess-cdn.clevelandart.org`) whose stored `rights` is `CC0` or `PUBLIC_DOMAIN`.

Art Institute of Chicago IIIF URLs (`artic.edu`) returned HTTP 403 from this environment. Pages do not hotlink them. The artwork page URL may still appear as a text locator in the source list, because that locator is stored on the museum record.

## Local display files

Each row is a JPEG made for display. The canonical license and description stay on the named record. Pages show that license and a not-evidence line with the image.

| Local path | Pixels | Record | License on the record | Source |
| --- | --- | --- | --- | --- |
| `site/media/odin-gehrts-1888.jpg` | 480×732 | `MEDIA-ODIN-GEHRTS-001` | Public domain / Public Domain Mark 1.0 | https://commons.wikimedia.org/wiki/File:Odhin.png |
| `site/media/witch-durer-1500.jpg` | 640×1018 | `MEDIA-WITCH-DURER-001` | CC0 | https://commons.wikimedia.org/wiki/File:Albrecht_Dürer,_Witch_Riding_on_a_Goat,_c._1500-1501,_NGA_6674.jpg |
| `site/media/witch-baldung-sabbath.jpg` | 640×932 | `MEDIA-WITCH-BALDUNG-001` | Public domain | https://commons.wikimedia.org/wiki/File:Hans_Baldung_-_Witches_Sabbath_-_WGA01221.jpg |
| `site/media/zeus-hypsistos.jpg` | 640×960 | `MEDIA-ZEUS-HYPSISTOS-DION-001` | Public domain | https://commons.wikimedia.org/wiki/File:Cult_Statue_of_Zeus_Hypsistos.JPG |
| `site/media/osiris-louvre.jpg` | 640×960 | `MEDIA-OSIRIS-LOUVRE-001` | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Ancient_Egypt_Stone_Statue_of_Osiris.jpg |
| `site/media/isis-horus.jpg` | 640×948 | Cleveland `1993.110` in `museum-reference-media.json` | CC0 | https://clevelandart.org/art/1993.110 |
| `site/media/shiva-nataraja.jpg` | 640×800 | Cleveland `1930.331` in `museum-reference-media.json` | CC0 | https://clevelandart.org/art/1930.331 |

The witch plates depict early modern interpretations of witches. They are not catalog entities. The witchcraft journey’s focus list stays empty.

The Gehrts plate is a 19th-century illustration. Its stored description says it is not an ancient depiction and not evidence for Viking-period iconography.

## Museum records

`site/museum-reference-media.json` holds Cleveland CC0 objects and Art Institute public-domain records. Cleveland `image_url` values (the `_web.jpg` files) may render when no local derivative is listed above, with the stored `NOT_EVIDENCE` line. Art Institute `image_url` values do not render. `thumbnail_url` on Cleveland rows points at the larger `_print.jpg` and is not used for these phone thumbnails. Deities without a rights-cleared local or Cleveland image stay text on the journey.
