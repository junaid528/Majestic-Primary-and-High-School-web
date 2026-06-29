const fs = require('fs');
const path = require('path');
const https = require('https');

// Define the images to be downloaded for each category
const imagesToDownload = {
  'computer-laboratory': [
    { name: 'workstations.jpg', id: 'photo-1547082299-de196ea013d6' },
    { name: 'web_project.jpg', id: 'photo-1573164713988-8665fc963095' },
    { name: 'projection_screen.jpg', id: 'photo-1531297484001-80022131f5a1' },
    { name: 'debugging.jpg', id: 'photo-1517694712202-14dd9538aa97' },
    { name: 'default.jpg', id: 'photo-1547082299-de196ea013d6' } // Fallback
  ],
  'islamiyat-quran': [
    { name: 'quran_recitation.jpg', id: 'photo-1435527173128-983b87201f4d' },
    { name: 'teacher_guiding.jpg', id: 'photo-1522202176988-66273c2fd55f' }, // Reusing Quran for guide
    { name: 'reading_holy_book.jpg', id: 'photo-1506880018603-83d5b814b5a6' }, // Reusing Quran for reading
    { name: 'silent_study.jpg', id: 'photo-1435527173128-983b87201f4d' },
    { name: 'arabic_worksheets.jpg', id: 'photo-1506880018603-83d5b814b5a6' },
    { name: 'annual_recitation.jpg', id: 'photo-1541339907198-e08756dedf3f' },
    { name: 'default.jpg', id: 'photo-1435527173128-983b87201f4d' } // Fallback
  ],
  'kids-playground': [
    { name: 'secure_play.jpg', id: 'photo-1596464716127-f2a82984de30' },
    { name: 'athletic_activities.jpg', id: 'photo-1576267423445-b2e0074d68a4' },
    { name: 'pastel_slides.jpg', id: 'photo-1596464716127-f2a82984de30' }, // Slides reuse secure_play
    { name: 'minor_sports.jpg', id: 'photo-1576267423445-b2e0074d68a4' }, // Sports reuse athletic
    { name: 'swing_sets.jpg', id: 'photo-1596464716127-f2a82984de30' },
    { name: 'outdoor_exercise.jpg', id: 'photo-1576267423445-b2e0074d68a4' },
    { name: 'default.jpg', id: 'photo-1596464716127-f2a82984de30' } // Fallback
  ],
  'science-laboratory': [
    { name: 'safety_goggles.jpg', id: 'photo-1593854519602-687eae339d57' },
    { name: 'protective_gloves.jpg', id: 'photo-1581594693702-fbdc51b2763b' },
    { name: 'lab_coats.jpg', id: 'photo-1532187643603-ba119ca4109e' },
    { name: 'fire_extinguishers.jpg', id: 'photo-1516216628859-9bccecab13ca' },
    { name: 'first_aid_kit.jpg', id: 'photo-1603398938378-e54eab446dde' },
    { name: 'science_fair.jpg', id: 'photo-1531482615713-2afd69097998' },
    { name: 'robotics.jpg', id: 'photo-1581092580497-e0d23cbdf1dc' },
    { name: 'teamwork.jpg', id: 'photo-1517245386807-bb43f82c33c4' },
    { name: 'olympiad.jpg', id: 'photo-1567057419565-4349c49d8a04' },
    { name: 'young_scientist.jpg', id: 'photo-1578575437130-527eed3abbec' },
    { name: 'robotics_championship.jpg', id: 'photo-1546410531-bb4caa6b424d' },
    { name: 'microscope_modern.jpg', id: 'photo-1576086213369-97a306d36557' }, // Modern lab / microscope lens
    { name: 'optics_experiments.jpg', id: 'photo-1507668077129-56e32842fceb' },
    { name: 'chemistry_titration.jpg', id: 'photo-1607613009820-a29f7bb81c04' },
    { name: 'botanical_slides.jpg', id: 'photo-1576086213369-97a306d36557' },
    { name: 'microscope_lens.jpg', id: 'photo-1576086213369-97a306d36557' },
    { name: 'flasks_beakers.jpg', id: 'photo-1532094349884-543bc11b234d' },
    { name: 'collaborative_lab.jpg', id: 'photo-1518152006812-edab29b069ac' },
    { name: 'science_mentor.jpg', id: 'photo-1617155093730-a8bf47be792d' },
    { name: 'cta_bg.jpg', id: 'photo-1531482615713-2afd69097998' },
    { name: 'default.jpg', id: 'photo-1576086213369-97a306d36557' } // Fallback
  ],
  'seminar-hall': [
    { name: 'parallax_bg.jpg', id: 'photo-1517245386807-bb43f82c33c4' },
    { name: 'students_attending.jpg', id: 'photo-1517245386807-bb43f82c33c4' },
    { name: 'presentation_panels.jpg', id: 'photo-1531482615713-2afd69097998' },
    { name: 'cushioned_seating.jpg', id: 'photo-1517245386807-bb43f82c33c4' },
    { name: 'active_presentation.jpg', id: 'photo-1531482615713-2afd69097998' },
    { name: 'audience_rows.jpg', id: 'photo-1540575467063-178a50c2df87' },
    { name: 'guest_speaker.jpg', id: 'photo-1475721027785-f74eccf877e2' },
    { name: 'default.jpg', id: 'photo-1517245386807-bb43f82c33c4' } // Fallback
  ],
  'facilities': [
    { name: 'campus_env.jpg', id: 'photo-1562774053-701939374585' },
    { name: 'default.jpg', id: 'photo-1562774053-701939374585' } // Fallback
  ]
};

// Helper to download an image with redirection handling
function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    const request = https.get(url, (response) => {
      // Handle redirect status codes (301, 302, 307, 308)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlink(dest, () => {}); // Clean up partial file
        downloadImage(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {}); // Clean up partial file
        reject(new Error(`Failed to download image: status code ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {}); // Clean up partial file
      reject(err);
    });
    
    // Set a timeout of 15 seconds
    request.setTimeout(15000, () => {
      request.destroy();
      file.close();
      fs.unlink(dest, () => {});
      reject(new Error('Request timed out'));
    });
  });
}

async function run() {
  console.log('Starting image downloads...');
  
  // Ensure assets/images/ exists
  const baseAssetsDir = path.join(__dirname, 'assets');
  const baseImagesDir = path.join(baseAssetsDir, 'images');
  
  if (!fs.existsSync(baseAssetsDir)) {
    fs.mkdirSync(baseAssetsDir);
  }
  if (!fs.existsSync(baseImagesDir)) {
    fs.mkdirSync(baseImagesDir);
  }

  let totalDownloaded = 0;
  let totalFailed = 0;

  for (const [category, items] of Object.entries(imagesToDownload)) {
    const categoryDir = path.join(baseImagesDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir);
      console.log(`Created directory: ${categoryDir}`);
    }

    for (const item of items) {
      const destPath = path.join(categoryDir, item.name);
      // Construct Unsplash URL with reasonable quality parameters (width=800, quality=80)
      const url = `https://images.unsplash.com/${item.id}?auto=format&fit=crop&w=800&q=80`;
      
      console.log(`Downloading ${category}/${item.name}...`);
      try {
        await downloadImage(url, destPath);
        console.log(`Successfully downloaded: ${category}/${item.name}`);
        totalDownloaded++;
      } catch (err) {
        console.error(`Failed downloading ${category}/${item.name}: ${err.message}`);
        totalFailed++;
        
        // Let's create a visual fallback (SVG/Canvas text image) if the download failed entirely so that the file still exists.
        try {
          const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
            <rect width="100%" height="100%" fill="#f1f5f9"/>
            <text x="50%" y="50%" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#64748b" text-anchor="middle" dominant-baseline="middle">
              ${category.toUpperCase().replace('-', ' ')} - ${item.name.replace('.jpg', '')}
            </text>
          </svg>`;
          fs.writeFileSync(destPath, svgFallback);
          fs.writeFileSync(destPath.replace('.jpg', '.svg'), svgFallback);
          console.log(`Created local vector SVG fallbacks for ${category}/${item.name}`);
        } catch (svgErr) {
          console.error(`Could not write fallback SVG: ${svgErr.message}`);
        }
      }
    }
  }

  console.log(`\nDownload summary:\nTotal downloaded: ${totalDownloaded}\nTotal failed: ${totalFailed}`);
}

run();
