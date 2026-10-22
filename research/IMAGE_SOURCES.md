# Restaurant imagery for the CAC app

Reviewed 21 October 2026. `restaurant-images.json` maps the 20 restaurant slugs to their official website imagery, source-page attribution, descriptive alternative text, and media verification. Nineteen image URLs returned HTTP 200 with an image media type and decodable pixels. Eighteen are venue or food/staff photographs; Pig Floyd’s & Pigzza supplies official brand artwork. Tako Cheena currently uses the app’s fallback because its official image endpoint returned HTTP 403.

These are restaurant-level illustrations. They do not establish a particular item’s recipe, allergens, dietary suitability, price, or availability. Chain promotional photographs are labeled as brand imagery and are not represented as photographs of the selected branch. No stock image or photograph of another restaurant was substituted for Tako Cheena.

## Source pages

| Restaurant | Official source | Image used |
| --- | --- | --- |
| Hawkers Orlando | https://eathawkers.com/locations/orlando/ | Orlando exterior |
| Fresh Kitchen | https://www.eatfreshkitchen.com/ | Staff member preparing a bowl; chain imagery |
| Chipotle South Orange | https://locations.chipotle.com/fl/orlando/2211-s-orange-ave | Promotional bowl; chain imagery |
| Black Rooster Taqueria | https://www.blackroostertaqueria.com/ | Food spread |
| Pig Floyd’s & Pigzza | https://www.pigfloyds.com/ | Official merged brand artwork |
| Tako Cheena | https://tako407cheena.com/ | No verified image; fallback |
| Loving Hut Orlando | https://lovinghut.us/orlando/ | Menu photograph |
| The Strand | https://www.strandorlando.com/ | Published food photograph |
| The Monroe | https://www.themonroeorlando.com/ | Dinner spread |
| Lazy Moon Mills 50 | https://www.lazymoonpizza.com/ | Mills 50 interior |
| Winter Park Biscuit Company | https://www.winterparkbiscuitco.com/ | Food photograph |
| Reyes Mezcaleria | https://www.reyesmex.com/ | Restaurant interior |
| The Osprey | https://www.theospreyorlando.com/ | Published food photograph |
| Seito Sushi Baldwin Park | https://www.seitosushibp.com/ | Dining interior |
| The Stubborn Mule | https://www.thestubbornmuleorlando.com/venue-photos | Venue photograph |
| Pizza Bruno | https://pizzabrunofl.com/ | Pizza and cannoli; brand imagery |
| Mamak | https://www.mamakeats.com/ | Roti canai and curry |
| Tin & Taco | https://www.tinandtaco.com/ | Published food photograph |
| Sparrow | https://www.sparroworlando.com/ | Restaurant interior |
| Osteria Ester | https://www.osteriaester.com/ | Bar/dining interior |

## Retrieval and rendering

`check-restaurant-images.py` uses Python’s standard HTTP library and Pillow. It reads the mapping, requests each available URL, verifies the response media type and image dimensions, and writes the actual status, bytes, dimensions, and check timestamp back to the JSON file. It runs at most eight checks in parallel and keeps downloaded bytes in memory. A missing image remains missing rather than being replaced with unrelated content. Run it with the bundled Python runtime used by the project’s other research scripts.

Observed responsive image variants are used where practical. Wix URLs containing `enc_avif` returned JPEG in these checks; the app is not being given an AVIF response. Most files are below 350 KB, with larger original official images for Sparrow and Pizza Bruno. The UI needs a loading/error fallback because third-party URLs can change or fail independently of the app. Lazy Moon uses the observed 800-pixel WebP variant rather than decoding its 6000-pixel original.

`research/previews/restaurant-photo-contact.jpg` is a QA contact sheet of the final image choices. Winter Park Biscuit was corrected during visual inspection because its initial candidate was an awards graphic. The authoritative current URLs and media checks are the JSON file.

## Rights and attribution

The files remain hosted on the restaurants’ official websites or the CDNs referenced by those sites. This research records provenance and attribution; it does **not** establish a Creative Commons license, obtain redistribution permission, or claim that publicly accessible images are public domain. No original photo files are included in the source package. Restaurant branding does not imply endorsement or a Verifed partnership. The app’s source link should remain available with each restaurant image. For a broader commercial release, replace these references with restaurant-authorized or appropriately licensed assets.
