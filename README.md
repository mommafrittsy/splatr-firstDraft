# splatr
The original first draft of Splatr from early 2019. This project was my first, end-to-end, build of a web-app with a database backend and a full frontend. Splatr was a platform for artists to list their commission offerings and for fans to support their favorite artists. Operating on with a node.js/Express server, MongoDB database, and a VanillaJS front-end, Splatr handled the full lifecycle of the artist commission process.

## Stack
* Express.js v4 - App server
* MongoDB - Document database
* EJS - Front-end conditional rendering
* Passport - Authentication middleware

## Integrations
Splatr integrated several external APIs and public packages:
* **External Integrations**
  * Algolia - Search
  * Mailjet - Email
  * Microsoft Azure - File storage 
  * Stripe - Payments
  * Unsplash - Background images
* **Packages**
  * Cropper.js - Image cropping
  * Jimp - Image resizing & watermarking
  * Streamifier - Multi-part, streaming uploads
 
## Lessons Learned
Lots of headaches, lessons, and fun throughout the process, but as it was my first end-to-end project, there were plenty of things that I could've done better:
* User input sanitization - Looking back, I really didn't do any type-matching or value-checking on user inputs.
* Interface standardization - Was a bit all-over-the-place with the styling of components and my CSS was anything but concise.
* User experience streamlining - The dashboard was overwhelming and the onboarding flow was long, overly complicated, and not focused on UX.
* Project structure/organization - The code structure for Splatr is a bit all over the place - some pieces are split into modules, others are written in place. Lots of clunky and hard-to-read node code.
