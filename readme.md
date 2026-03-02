# Ever Capture
## Description
Ever Capture is an app that allows users to add notes, weblink and pictures that can be tagged and viewed in both long and short formats. Users can easily upload images or write notes and organize them with custom tags such as "Work," "Personal," or "Travel."

With a powerful search function, users can filter notes and images based on tags or keywords, enabling efficient organization and retrieval of content. The app is fully mobile-friendly, allowing users to capture notes and images on the go.

## Key Features
### Add Notes, weblink and Pictures
Users can write notes, save weblinks and upload images at any time. Each entry can be tagged with custom labels like "Work," "Personal," "Travel," etc., for easy organization.

### Tagging System
Implementing a tagging feature allows users to categorize their notes and pictures, facilitating better search and organization.

### Long View
Entries display as list patten.  Each entry shows all content includes:
- Title/url
- Date
- Content
- Tags
- Image(s)

### Short View
Entries only display their titles.

### Search by Tags
A search feature allows users to filter notes and images by tags or keywords, making it simple to locate specific content.

### Mobile-Friendly
Designed for users on the go, the app ensures a seamless experience across mobile devices, allowing easy access to notes and pictures anytime, anywhere.

## How to install and use on Mac
-  git clone https://github.com/gplei/everCapture 
-  cd everCapture
-  npm install
-  npm start
- go to //localhost:4000

## View your crumb
In general, a crumb can be a note if there is no url.
If the crumb has an url, it will be shown as a link.
If the url is an image, it will be shown as an image.
This is distinguashed as the type icon before title.
Click on the icon will go to the url if url is present.  Otherwise it will go to the crumb's detail view.
### List view
All scrumbs are shown from the beginning and load more as users scroll down by default.
Type in tag and click the selected tag, the scrumbs filtered are shown.
Select a date, the scrumb of the month are shown.
Click on image icon on far left, only scrumbs with images are shown.
Click up/down icon on far right will hide/show all descriptions.  Users can also click individual up/down icon to hide/show that description.
Click on the title of each crumb will go to crumb detail view
Click second icon from right will go to compact view
Click edit icon will go to edit view
### Compact view
The view will show crumbs of one tag at a time.  
If a crumb has only one tag, i.e. the search tag, it will be shown under the search tag.
When a crumb has more than one tag in addition to the search tag, it will be shown under that tag but not under the search tag.
By default, the crumbs with tag 'Uncategorized' will be shown.
Click a tag will search that tag in the same view.
Click a title will go to the detail view.
Click on image icon on far left, only scrumbs with images only are shown.
In this image view, there is a type icon after a group of image.  This group of image belongs to a crumb.  Click on the type icon will go to detail view.
### Detail view
The view will show only one crumb at a time.
Click on any image will pop up the image and users can click next/prev button to browse the enlarged images.
### Add view
Click 'Add Crumb' button on header will go to add view.
In add view, users can create a new crumb.  Users cannot add/delete image.
### Edit view
In edit view, users can update the crumb.
Users can add/delete images of the crumb.
## Merge crumb of same tag
This is specifically for merging daily logs into a monthly log.
Create couple daily log with same tag as
- log 1
    - date: 05/01
    - title: Go to grocery
    - description: Went to Costco
    - tag: Log May 2025
- log 2
    - date: 05/03
    - title: Watch movie
    - description: Watched Timeless
    - tag: Log May 2025

They will be merged as
- merged log
    - tag: Daily log, log
    - title: Log May 2025
    - description: 
- How to start servers for dev and production
    - npm run dev
    - npm run build
    - node --watch src/server/server.js
    - node src/server/server.js
    
> 05/01 Mon Go to grocery  
> Went to Costco  
> 
> 05/03 Wed Watch movie  
> Watched Timeless
    
