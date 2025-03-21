---
title: "Screensaver Spelunking"
date: 2025-03-21 11:14:00 -0700
layout: post
tags: macos
---

Macos Sonoma brought to the Mac the [amazing aerial screensavers/wallpapers](https://bzamayo.com/watch-all-the-apple-tv-aerial-video-screensavers#9c6b969b62012359e5a4ead2ba3889e8) that can be found on the AppleTV. (I say screensavers/wallpapers because you can choose to have your wallpaper be a frame of whatever your screeensaver is.)

One thing missing, though, are the descriptions of what is being displayed. If I see some amazing place my first question is "where is that?" On the AppleTV you can view the description by clicking (swiping?) up on the remote. There doesn't seem to be any secret keys or incantations to get it to display on the Mac, though, even though that information is available. If you go into Settings -> Screen Saver on your Mac, you'll see descriptions:

![Screensaver Descriptions](/public/images/screensavers/screensaver-settings.png)

I figured it couldn't be that hard to (a) find out what the current screensaver is, (b) look up the description somewhere, and (c) find easy way to show that information. It turned out to be not easy, but I did figure it out.

## The Screensavers

Searching for "macos where are aerial screensavers stored" gives `/Library/Application Support/com.apple.idleassetsd/Customer/4KSDR240FPS`. If you open that directory in Finder (run `open /Library/Application\ Support/com.apple.idleassetsd/Customer/4KSDR240FPS` from the Terminal), you'll see they're all MOV videos. Apparently `idleassetsd` is the process that handles the downloading and display of the aerial screensavers.

My first thought was that maybe the descriptions were encoded in the video somehow, but after digging around in them a bit, that turned out not to be the case.

## The Screensaver Database

I looked in the `/Library/Application\ Support/com.apple.idleassetsd/` directory and lo! there was sqlite database: `Aerial.sqlite`:

```
sqlite> .tables
ZASSET             ZUSER              Z_1SUBCATEGORIES   Z_METADATA
ZCATEGORY          Z_1CATEGORIES      Z_2ACTIVEFORUSERS  Z_MODELCACHE
ZSUBCATEGORY       Z_1PINNEDFORUSERS  Z_3ACTIVEFORUSERS  Z_PRIMARYKEY
```

Exploring these tables, we find some information, but nothing terribly descriptive:

```
sqlite> select ZACCESSIBILITYLABEL from ZASSET limit 3;
Iran and Afghanistan
Caribbean
Africa and the Middle East
```

## Ripgrep to the Rescue

Since I knew the description strings had to be _somewhere_ on my hard drive, the next obvious move was to just search for them. I picked a word from one of the descriptions that was unlikely to be found elsewhere—"Temblor," from "California's Temblor Range"—and fired up [ripgrep](https://github.com/BurntSushi/ripgrep).

```
> rg Temblor /Library/Application\ Support/com.apple.idleassetsd/
>
```

Nothing. Hmm. After a bit of head-scratching and poking around in other places, I realized that ripgrep by default doesn't search binary files. So:

```
> rg --binary Temblor /Library/Application\ Support/com.apple.idleassetsd/
/Library/Application Support/com.apple.idleassetsd/Customer/TVIdleScreenStrings.bundle/sv.lproj/Localizable.nocache.strings: binary file matches (found "\0" byte around offset 12)

/Library/Application Support/com.apple.idleassetsd/Customer/TVIdleScreenStrings.bundle/es_419.lproj/Localizable.nocache.strings: binary file matches (found "\0" byte around offset 12)

...
```

Bingo! A strings bundle is a collection of localized strings. Given a key that uniquely identifies a string and a language, you can look up the translation of that string in that language.

The next piece was to find all the string keys. The above `ZASSET` table has a `ZLOCALIZEDNAMEKEY` column. But, while poking around in the `com.apple.idleassetsd` folder, I found an `entries.json` file that had everything I needed in one file:

```
> cat "/Library/Application Support/com.apple.idleassetsd/Customer/entries.json" | jq ".assets[0]"
{
  "id": "009BA758-7060-4479-8EE8-FB9B40C8FB97",
  "showInTopLevel": true,
  "shotID": "GMT026_363A_103NC_E1027_KOREA_JAPAN_NIGHT",
  "localizedNameKey": "GMT026_363A_103NC_E1027_KOREA_JAPAN_NIGHT_NAME",
  "accessibilityLabel": "Korea and Japan Night",
  "pointsOfInterest": {
    "60": "GMT026_363A_103NC_E1027_60",
    "150": "GMT026_363A_103NC_E1027_150",
    "0": "GMT026_363A_103NC_E1027_0",
    "32": "GMT026_363A_103NC_E1027_32",
    "195": "GMT026_363A_103NC_E1027_195",
    "22": "GMT026_363A_103NC_E1027_22",
    "110": "GMT026_363A_103NC_E1027_110",
    "260": "GMT026_363A_103NC_E1027_260",
    "180": "GMT026_363A_103NC_E1027_180"
  },
  "previewImage": "https://sylvan.apple.com/itunes-assets/Aerials126/v4/51/ff/08/51ff0824-8da5-78f0-e218-9e61264965bb/Space_Korea_Japan_01@2x.png",
  "includeInShuffle": true,
  "url-4K-SDR-240FPS": "https://sylvan.apple.com/itunes-assets/Aerials116/v4/cb/5b/50/cb5b5035-6701-619f-9065-3d7d0e5fbef4/comp_GMT026_363A_103NC_E1027_KOREA_JAPAN_NIGHT_v18_SDR_PS_20180907_240fps_0d0095d4-5875-4d43-a1a8-7dc915b11b9dq24_sRGB_tsa.mov",
  "subcategories": [
    "61171241-39F3-4ADE-84AA-9CD4EE4A78DA"
  ],
  "preferredOrder": 9,
  "categories": [
    "55B7C95D-CEAF-4FD8-ADEF-F5BC657D8F6D"
  ]
}
```

I looks like you can even get different descriptions based on how far along you are in the screensaver video.

## The Final Boss: Getting the Active Screensaver

The last bit of information I needed was determining the active (or last active) screensaver. I think I spent the most time on this. I was not able to find anything. Eventually I realized that some process had to have that file open, and if so, [`lsof`](https://man7.org/linux/man-pages/man8/lsof.8.html) would find it.

`idleassetsd` came up empty, so I looked through my process list for other suspects, and found `WallpaperVideoExtension`:

```
> lsof -Fn -p $(pgrep WallpaperVideoExtension) | grep ".mov"
n/Library/Application Support/com.apple.idleassetsd/Customer/4KSDR240FPS/B8F204CE-6024-49AB-85F9-7CA2F6DCD226.mov
```

Boom!

## Putting it all Together

I threw together a little Mac menu bar app, [WallpaperInfo](https://github.com/bgreenlee/WallpaperInfo/). Most of the logic is in [Wallpaper.swift](https://github.com/bgreenlee/WallpaperInfo/blob/main/WallpaperInfo/Wallpaper.swift):

1. [Decode all the assets in entries.json.](https://github.com/bgreenlee/WallpaperInfo/blob/main/WallpaperInfo/Wallpaper.swift#L63-L69)
2. [Have a description field on the asset that looks up its localized description string in the strings bundle.](https://github.com/bgreenlee/WallpaperInfo/blob/main/WallpaperInfo/Wallpaper.swift#L63-L69)
3. [Use `pgrep` and `lsof` to find the aerial video currently active, and use the identifier embedded in the filename to look up the asset.](https://github.com/bgreenlee/WallpaperInfo/blob/main/WallpaperInfo/Wallpaper.swift#L75-L91)

The result:

![Wallpaper Info Screenshot](/public/images/screensavers/screenshot.png)

Sadly, I wouldn't be able to put this in the App Store because of Apple's sandboxing rules, but feel free to [download the binary](https://github.com/bgreenlee/WallpaperInfo/releases/latest) from my repo.

It would be nice to have the description on the screensaver itself, like the AppleTV does, but I don't think that's possible short of either editing the videos to add descriptions, or running your own version of the screensaver. But given that Apple could easily add this as a feature (please!), I didn't want to invest too much more time into this. I considered my itch scratched.
