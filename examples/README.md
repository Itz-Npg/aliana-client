# Fast Track Examples

Yeh folder mein complete working examples hain fast track fetching aur playing ke.

## Files

### 1. `fast-track-demo.ts`
Complete Discord bot example with all fast track features:
- **Quick Play**: Instant track playback
- **Batch Fetching**: Multiple tracks ek saath
- **Pre-loading**: Popular tracks pehle se load
- **Cache Stats**: Performance monitoring
- **Search**: Fast search with caching

## Setup

1. **Install Dependencies**
```bash
npm install discord.js
```

2. **Configure Bot Token**
`fast-track-demo.ts` mein apna bot token add karo:
```typescript
client.login('YOUR_BOT_TOKEN');
```

3. **Setup Lavalink Server**
Lavalink server run karo on `localhost:2333`

4. **Run Demo**
```bash
npx ts-node examples/fast-track-demo.ts
```

## Commands

### `!play <song>`
Sabse fast method - ek command se fetch + play
```
!play Believer
!play Sidhu Moose Wala 295
```

### `!search <query>`
Search results dekho with cache timing
```
!search Imagine Dragons
```

### `!playlist`
Pre-defined playlist load karo (batch fetching demo)
```
!playlist
```

### `!batch <song1> | <song2> | <song3>`
Custom batch fetching
```
!batch Believer | Thunder | Radioactive
```

### `!preload`
Popular tracks pre-load karo for instant playback
```
!preload
```

### `!stats`
Cache performance stats dekho
```
!stats
```

## Performance Benefits

### Without Caching
- First fetch: ~400-600ms
- Repeated fetch: ~400-600ms (same)

### With FastTrackFetcher
- First fetch: ~400-600ms
- Repeated fetch: ~50-100ms (10x faster!)
- Batch fetching: Parallel requests
- Pre-loading: 0ms playback delay

## Key Features Demonstrated

1. **Caching**: Automatic caching with 10-minute timeout
2. **Batch Processing**: Multiple tracks simultaneously
3. **Pre-loading**: Background loading for instant playback
4. **Performance Metrics**: Real-time timing and statistics
5. **Error Handling**: Proper error handling and user feedback

## Tips

- Use `youtubemusic` source for better music results
- Enable cache for frequently played tracks
- Pre-load popular tracks on bot startup
- Monitor cache stats to optimize performance
- Clear cache if you want fresh results

## More Examples

Complete documentation: `../FAST_TRACK_EXAMPLES.md`
