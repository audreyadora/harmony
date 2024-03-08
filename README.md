# **Harmony**
## 🎸 **Midi Editor + Fretboard Diagram Generator + Scale Explorer** 🎵

### Feature Overview

This web app is designed as a toolkit for midi-guitar playalong and reharmonization 🌟 

Both the fretboard and midi note editor components render through a custom webgl2 implementation. The motivation for making a WebGL2 render engine came from the need for a simple to impliment midi editor component that doesn't rely on HTML Divs for each rectangle, as with larger midi files this becomes unstable and resource heavy. 

Try it out with this midi file: [Debussy: Arabesque](https://github.com/audreyadora/harmony/blob/9bd184101be2895db87d364ca5297d4de0dbe762/static/arabesqu.mid)

The interface is designed to be as intuitive as possible. All aspects of the fretboard including scale length and string count are controllable with the settings in the left sidebar. All sections of the app can be resized at the dividers. The center section is a simple text endpoint listing the selected notes in order.

Keyboard shortcuts for the Midi Piano Roll: 
| Action | Shortcut |
| ------ | ------ |
| Add Note | Double Click Canvas |
| Select All | Ctrl + A|
| Select Notes | Click Canvas + Drag Cursor|
| Translate Selected Notes | Click Note + Drag Cursor |
| Turn Off Snap to Grid  | Shift + Drag Cursor |
| Delete Selected Notes | Del |
| Add/Remove Note from Selection | Ctrl or Shift + Click Note|
| Clone | Ctrl + Drag selected notes|
| Copy | Ctrl + C |
| Cut | Ctrl + X |
| Paste | Ctrl + V |
| Undo | Ctrl + Z |
| Redo | Ctrl + Y |
| Zoom to Cursor | Scrollwheel or Trackpad |
| Zoom X | Shift + Scrollwheel or Trackpad |
| Zoom Y | Ctrl + Scrollwheel or Trackpad |

To do: 
-implement mac-friendly keyboard shortcuts. 
-rewrite and optimize scale lookup function
-add midi and fretboard audio playback 
-centralize surface-layer UI state management: 
  presently the app will prioritize selected notes on piano roll, and you need to deselect notes to be able to change the marker stylings for the   non-selected intervals  

![Harmony Web App UI example](https://github.com/audreyadora/harmony/blob/f158d8e00c25b648d81c86c451eb8c078a72bf6c/harmony-ui.png)
