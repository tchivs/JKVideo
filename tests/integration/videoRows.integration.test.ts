import { describe, expect, it } from 'vitest';
import { toListRows } from '../../utils/videoRows';
import type { LiveRoom, VideoItem } from '../../services/types';

function makeVideo(id: number, view: number): VideoItem {
  return {
    bvid: `BV${id}`,
    aid: id,
    title: `video-${id}`,
    pic: `https://example.com/${id}.jpg`,
    owner: { mid: id, name: `owner-${id}`, face: '' },
    stat: {
      view,
      danmaku: 0,
      reply: 0,
      like: 0,
      coin: 0,
      favorite: 0,
    },
    duration: 60,
    desc: '',
  };
}

function makeLiveRoom(id: number): LiveRoom {
  return {
    roomid: id,
    uid: id,
    title: `live-${id}`,
    uname: `主播-${id}`,
    face: `https://example.com/live-${id}.jpg`,
    cover: `https://example.com/live-cover-${id}.jpg`,
    online: 100,
    area_name: '分区',
    parent_area_name: '父分区',
  };
}

describe('toListRows integration', () => {
  it('injects live row and keeps highest-view item as BigRow', () => {
    const pages = [[
      makeVideo(1, 100),
      makeVideo(2, 9999),
      makeVideo(3, 200),
      makeVideo(4, 300),
      makeVideo(5, 400),
    ]];
    const liveRooms = [makeLiveRoom(11), makeLiveRoom(12)];

    const rows = toListRows(pages, liveRooms);

    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows[0].type).toBe('big');
    if (rows[0].type === 'big') {
      expect(rows[0].item.bvid).toBe('BV2');
    }
    expect(rows[1].type).toBe('live');
    if (rows[1].type === 'live') {
      expect(rows[1].left.roomid).toBe(11);
      expect(rows[1].right?.roomid).toBe(12);
    }
  });

  it('falls back to pair+big layout when no live rooms', () => {
    const pages = [[
      makeVideo(1, 100),
      makeVideo(2, 900),
      makeVideo(3, 200),
      makeVideo(4, 300),
    ]];

    const rows = toListRows(pages);

    expect(rows.some(r => r.type === 'live')).toBe(false);
    expect(rows.some(r => r.type === 'big')).toBe(true);
    expect(rows.some(r => r.type === 'pair')).toBe(true);
  });
});
