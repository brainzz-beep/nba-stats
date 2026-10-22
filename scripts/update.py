#!/usr/bin/env python3
"""Scarica box score, quote e infortuni NBA da ESPN e scrive data/games.json e data/today.json."""
import json, os, time, datetime as dt
from urllib.request import urlopen, Request
from concurrent.futures import ThreadPoolExecutor
from zoneinfo import ZoneInfo

BASE = 'https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/'
START = os.environ.get('START_DATE', '2025-10-01')  # inizio della stagione corrente: si tengono solo i dati da qui

def ok(name):
    return not name.startswith('Team ') and name not in ('World', 'USA')  # esclude le squadre dell'All-Star Game
ET = ZoneInfo('America/New_York')

def get(url):
    for i in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30) as r:
                return json.load(r)
        except Exception:
            time.sleep(2 * (i + 1))
    return None

def num(v):
    try: return float(v)
    except Exception: return 0.0

def ma(v):
    p = str(v or '').split('-')
    return (num(p[0]), num(p[1])) if len(p) == 2 else (0.0, 0.0)

def parse(box, ev):
    comp = ev['competitions'][0]
    teams = {str(c['team']['id']): c for c in comp['competitors']}
    date = dt.datetime.fromisoformat(ev['date'].replace('Z', '+00:00')).astimezone(ET).strftime('%Y-%m-%d')
    rows = []
    for tb in (box.get('boxscore') or {}).get('players', []):
        tid = str(tb['team']['id'])
        me = teams.get(tid)
        oid = next((x for x in teams if x != tid), None)
        if not me or not oid: continue
        opp = teams[oid]
        for blk in tb.get('statistics', []):
            idx = {l: i for i, l in enumerate(blk.get('labels', []))}
            for a in blk.get('athletes', []):
                st = a.get('stats') or []
                if a.get('didNotPlay') or not st: continue
                g = lambda l: st[idx[l]] if l in idx and idx[l] < len(st) else ''
                try: mn = float(g('MIN'))
                except Exception: continue
                fg, t3, ft = ma(g('FG')), ma(g('3PT')), ma(g('FT'))
                at = a['athlete']
                pos = (at.get('position') or {}).get('abbreviation', '')
                rows.append([ev['id'], date, me['team']['displayName'], opp['team']['displayName'],
                             1 if me.get('homeAway') == 'home' else 0, at['displayName'], pos, mn,
                             num(g('PTS')), fg[0], fg[1], t3[0], t3[1], ft[0], ft[1],
                             num(g('REB')), num(g('AST')), num(g('STL')), num(g('BLK'))])
    return rows

def dump(path, obj):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))

def main():
    os.makedirs('data', exist_ok=True)
    path = 'data/games.json'
    rows = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else []
    rows = [r for r in rows if r[1] >= START and ok(r[2]) and ok(r[3])]
    known = {r[0] for r in rows}
    lines = json.load(open('data/lines.json', encoding='utf-8')) if os.path.exists('data/lines.json') else {}
    last = max((r[1] for r in rows), default=None)
    today = dt.datetime.now(ET).date()
    d = dt.date.fromisoformat(last) - dt.timedelta(days=2) if last else dt.date.fromisoformat(START)
    miss = [r[1] for r in rows if r[0] not in lines]
    if miss: d = min(d, dt.date.fromisoformat(min(miss)))  # recupera i punteggi per quarti delle partite già scaricate
    while d <= today:
        sb = get(BASE + 'scoreboard?limit=100&dates=' + d.strftime('%Y%m%d')) or {}
        for e in sb.get('events', []):
            cs = e['competitions'][0]['competitors']
            if e['status']['type'].get('completed') and all(ok(c['team']['displayName']) for c in cs):
                q = {c['team']['displayName']: [int(num(l.get('value'))) for l in c.get('linescores', [])] for c in cs}
                if all(q.values()): lines[e['id']] = q
        evs = [e for e in sb.get('events', [])
               if e['status']['type'].get('completed') and e['id'] not in known
               and (e.get('season') or {}).get('type') != 1
               and all(ok(c['team']['displayName']) for c in e['competitions'][0]['competitors'])]
        with ThreadPoolExecutor(6) as ex:
            boxes = list(ex.map(lambda e: get(BASE + 'summary?event=' + e['id']), evs))
        for e, b in zip(evs, boxes):
            if b:
                new = parse(b, e)
                if new:
                    rows += new; known.add(e['id'])
        d += dt.timedelta(days=1)
    rows.sort(key=lambda r: r[1])
    dump(path, rows)
    dump('data/lines.json', lines)

    # partite in programma (oggi e domani) con linea e infortuni
    games = []
    tids = {}
    for off in (0, 1):
        day = today + dt.timedelta(days=off)
        sb = get(BASE + 'scoreboard?limit=100&dates=' + day.strftime('%Y%m%d')) or {}
        for e in sb.get('events', []):
            c = e['competitions'][0]
            home = next((x for x in c['competitors'] if x.get('homeAway') == 'home'), None)
            away = next((x for x in c['competitors'] if x.get('homeAway') == 'away'), None)
            if not home or not away: continue
            if not e['status']['type'].get('completed'):
                tids[home['team']['displayName']] = home['team']['id']
                tids[away['team']['displayName']] = away['team']['id']
            o = (c.get('odds') or [{}])[0]
            games.append({'id': e['id'], 'date': e['date'], 'done': bool(e['status']['type'].get('completed')),
                          'home': home['team']['displayName'], 'away': away['team']['displayName'],
                          'line': o.get('details', ''), 'ou': o.get('overUnder', '')})
    inj = {}
    for t in (get(BASE + 'injuries') or {}).get('injuries', []):
        inj[t.get('displayName', '')] = [{'n': (i.get('athlete') or {}).get('displayName', ''),
                                           's': i.get('status', ''),
                                           'd': (i.get('shortComment') or '')[:140]}
                                          for i in t.get('injuries', [])]
    rosters = {}
    for name, tid in tids.items():
        ath = (get(BASE + 'teams/%s/roster' % tid) or {}).get('athletes', [])
        flat = []
        for a in ath:
            flat += a.get('items', [a]) if isinstance(a, dict) else []
        rosters[name] = [{'n': a.get('displayName', ''), 'p': (a.get('position') or {}).get('abbreviation', '')}
                         for a in flat if a.get('displayName')]
    dump('data/today.json', {'updated': dt.datetime.utcnow().isoformat() + 'Z', 'games': games, 'injuries': inj, 'rosters': rosters})
    print('righe:', len(rows), '| partite in programma:', len(games), '| squadre con infortuni:', len(inj), '| rose:', len(rosters))

if __name__ == '__main__':
    main()
