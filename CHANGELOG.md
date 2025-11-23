# Changelog

All notable changes to Aliana-Client will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.7] - 2025-11-23

### Fixed
- **Queue State Management**: Fixed `Queue.clear()` not properly clearing the `current` track property
  - Previously, when clearing the queue, only the `tracks` array was emptied, but `current` remained set
  - This caused paused songs to persist in storage and replay incorrectly after player destruction
  - Now `Queue.clear()` properly sets `this.current = null` before saving
  
- **Player Stop Behavior**: Fixed `Player.stop()` not clearing the current track from queue
  - Added `await this.queue.setCurrent(null)` to properly clear queue state when stopping
  - Prevents previously paused/playing tracks from resuming after stop command
  
- **Player Queue Integration**: Added missing `queue.setPlayer(this)` call in Player constructor
  - Ensures the queue has a reference back to the player instance
  - Improves state synchronization between player and queue

### Changed
- **Stop Command Best Practice**: Updated test bot to use `player.stop()` + `queue.clear()` instead of `player.destroy()`
  - Keeps voice connection alive for faster subsequent playback
  - Follows the pattern used in reference implementations like lavalink-client
  - Reduces reconnection delays when playing songs after stopping

### Technical Details
The core issue was in the queue persistence layer. When a player was destroyed or stopped:
1. The queue would save with `current` track still set
2. On next player creation, queue would load from storage with stale `current` track
3. New tracks would be added to queue but old `current` would play first

The fix ensures proper cleanup of queue state at multiple levels:
- `Queue.clear()` - Clears both tracks array and current track
- `Player.stop()` - Explicitly clears current track via `setCurrent(null)`
- Player constructor - Links queue back to player via `setPlayer()`

## [1.0.5] - Previous Release

### Features
- Initial stable release with full Lavalink v4 support
- Multi-source music playback (YouTube, Spotify, SoundCloud, etc.)
- Advanced audio filters and normalization
- Queue management with persistence
- Autoplay system
- Music card generation
