<h2>Stream Overlay</h2>

<p>
  This app shows borderless, transparent, click-through browser windows for
  streaming. For example, you can show your Twitch chat and alerts on your
  display, over your game.
</p>

<p>
  I made this app because I would often not notice my chat messages on my other
  monitor, and I'd prefer to have them come up on the display I'm looking at,
  rather than in an OBS overlay. It's also great for single monitor streamers.
</p>

<p>
  <img
    style="width: 100%; height: auto; max-width: 500px;"
    src="{assets}/stream-overlay-clip.webp"
    alt="Screen capture showing Stream Overlay in use on top of a game."
  />
</p>

<h2>Usage</h2>

<p>
  Create a config file with your overlay setup and save it to your computer. You
  can then open the config file with the app, or launch it from the config
  editor.
</p>

<h2>Startup Config</h2>

<p>
  Turn on "Launch on startup" for a saved config file, and Stream Overlay will
  open those overlays by itself the next time it starts, so you don't have to
  open the config file every time. Opening a config file from your file manager,
  or passing one on the command line, still takes precedence.
</p>

<p>
  The config editor opens at startup either way, with the config files that were
  open last time, so you never have to hunt for them again. Starting the app a
  second time brings that editor up instead of running a second copy.
</p>

<h2>Arranging Windows</h2>

<p>
  The config editor draws your displays with every window of the open config on
  them. Drag a window to place it, drag its bottom right corner to resize it,
  and use the arrow keys to nudge the selected one (hold Shift for 10 pixels at
  a time). Windows snap to the edges and the middle of a display, and dragging
  one onto another display changes which display it opens on.
</p>

<p>
  Windows that are already open follow along as you edit them, so there's no
  need to relaunch to see a change. Open windows are marked with a green dot in
  the editor, and can be closed one at a time or all at once.
</p>

<h2>Edit Mode</h2>

<p>
  Overlays are click-through, which also makes them hard to grab. "Edit Mode"
  makes every open overlay clickable and draggable at once, and turning it off
  puts them back. A keyboard shortcut for it can be set next to the button; it
  is off until you set one, and works even while another app is focused.
</p>

<h2>Moving and Resizing</h2>

<p>
  Focus an overlay window from the tray menu, then drag it by its handle or drag
  its edges to resize it. While the config editor is open, the window's position
  and size are written back into the config it was launched from, so you can
  save the layout you just arranged instead of typing in numbers.
</p>

<h2>Positioning</h2>

<p>
  Each window is placed against an edge or the center of the display. Pick a
  spot in the "Align To" grid (top left, top center, top right, and so on), then
  set the horizontal and vertical offsets. Offsets are measured inward from the
  edge you aligned to, so a right aligned window with an X offset of 20 sits 20
  pixels from the right edge of the display, and a bottom aligned window with a
  Y offset of 0 sits flush against the bottom.
</p>

<p>
  For a centered alignment, the offset nudges the window away from the center.
  Offsets and sizes can both be given in pixels or as a percent of the display,
  and the "Fill screen area" button sets the window to cover the whole display.
</p>

<p>
  By default, windows stay inside the work area, so they don't cover your
  taskbar or panels. Turn on "Use whole display" to position and size the window
  against the full display instead.
</p>

<h2>Interaction</h2>

<p>
  You can see a list of open overlay windows from the "Stream Overlay" tray icon
  menu. Selecting one will focus that window. When a window is focused it will
  have an opaque background, and a handle to drag it around. Once it loses
  focus, it will go back to transparent, and will be click-through again, so you
  can click the apps behind it.
</p>

<h2>Fullscreen Apps</h2>

<p>
  Stream Overlay doesn't work over proper fullscreen windows, so your game needs
  to be in "borderless" or "borderless fullscreen" to allow Stream Overlay on
  top of it. If it's still not appearing on top, try setting it to windowed mode
  then back to borderless.
</p>

<h2>Support Me</h2>

<p>
  You can support me directly by supporting my email service, Port87:<br />
  <a href="https://port87.com/" target="_blank">https://port87.com/</a><br /><br
  />
  You can also buy stuff from my merch shop, Ice Cream on a Hot Dog:<br />
  <a href="https://icecreamonahotdog.com/" target="_blank"
    >https://icecreamonahotdog.com/</a
  ><br /><br />
  You can also support me for free by following me on Twitch:<br />
  <a href="https://www.twitch.tv/sylphweed" target="_blank"
    >https://www.twitch.tv/sylphweed</a
  >
</p>

<script lang="ts">
  import { assets } from '$app/paths';
</script>
