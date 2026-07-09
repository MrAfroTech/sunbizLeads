import instaloader
import csv
import os
import time
import random
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

USERNAME      = os.getenv("IG_USERNAME")
PASSWORD      = os.getenv("IG_PASSWORD")
MIN_FOLLOWERS = int(os.getenv("MIN_FOLLOWERS", 500))
MIN_POSTS     = int(os.getenv("MIN_POSTS", 12))
MAX_POSTS_PER = int(os.getenv("MAX_POSTS_PER_HASHTAG", 100))
MAX_INACTIVE  = int(os.getenv("MAX_DAYS_INACTIVE", 90))
SLEEP_MIN     = float(os.getenv("SLEEP_MIN", 4))
SLEEP_MAX     = float(os.getenv("SLEEP_MAX", 10))

OUTPUT_CSV   = "igHandles.csv"
SKIPPED_FILE = "ran_handles.json"

HASHTAGS = [
    "MiamiEventPlanner", "MiamiEvents", "MiamiWedding",
    "FortLauderdaleEvents", "FtLauderdaleEventPlanner",
    "BocaRatonEvents", "DelrayBeachEvents", "PalmBeachEvents",
    "WestPalmBeachEvents", "WPBEventPlanner",
    "TreasureCoastEvents", "PortStLucieEvents",
    "OrlandoEventPlanner", "OrlandoEvents", "CentralFloridaEvents",
    "KissimmeeEvents", "KissimmeeEventPlanner",
    "LakelandFLEvents", "LakelandEventPlanner",
    "TampaEventPlanner", "TampaEvents", "TampaBayWedding",
    "StPeteEvents", "StPetersburgEvents", "ClearwaterEvents",
    "SarasotaEvents", "SarasotaEventPlanner",
    "FortMyersEvents", "NaplesFloridaEvents", "SWFLEvents",
    "OcalaEvents", "OcalaEventPlanner",
    "GainesvilleEvents", "GainesvilleFLEvents",
    "DaytonaBeachEvents", "DaytonaEventPlanner",
    "SpaceCoastEvents", "BrevardEvents",
    "TallahasseeEvents", "TallahasseeEventPlanner",
    "PensacolaEvents", "PanamaCityEvents", "EmeraldCoastEvents",
    "JacksonvilleEventPlanner", "JaxEvents", "JacksonvilleFL",
]

FL_KEYWORDS = [
    "florida", " fl ", "fl,", "miami", "orlando", "tampa", "jacksonville",
    "ft lauderdale", "fort lauderdale", "boca", "delray", "west palm",
    "sarasota", "naples", "fort myers", "gainesville", "tallahassee",
    "pensacola", "daytona", "brevard", "space coast", "treasure coast",
    "kissimmee", "lakeland", "clearwater", "st pete", "st. pete",
]

def load_ran_handles():
    if os.path.exists(SKIPPED_FILE):
        with open(SKIPPED_FILE, "r") as f:
            return set(json.load(f))
    return set()

def save_ran_handles(handles):
    with open(SKIPPED_FILE, "w") as f:
        json.dump(list(handles), f)

def is_florida_based(bio):
    bio_lower = bio.lower()
    return any(kw in bio_lower for kw in FL_KEYWORDS)

def passes_filters(profile, bio):
    if profile.followers < MIN_FOLLOWERS:
        return False, f"followers {profile.followers} < {MIN_FOLLOWERS}"
    if profile.mediacount < MIN_POSTS:
        return False, f"posts {profile.mediacount} < {MIN_POSTS}"
    if not is_florida_based(bio):
        return False, "no FL location signal in bio"
    return True, "ok"

def get_last_post_date(profile):
    try:
        post = next(iter(profile.get_posts()), None)
        if post:
            return post.date_local
    except Exception:
        pass
    return None

def is_recently_active(last_post_date):
    if last_post_date is None:
        return False
    cutoff = datetime.now(last_post_date.tzinfo) - timedelta(days=MAX_INACTIVE)
    return last_post_date >= cutoff

def init_csv():
    if not os.path.exists(OUTPUT_CSV):
        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["handle","full_name","followers","following","post_count","bio","external_url","last_post_date","found_via_hashtag","scraped_at"])

def append_to_csv(row):
    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["handle","full_name","followers","following","post_count","bio","external_url","last_post_date","found_via_hashtag","scraped_at"])
        writer.writerow(row)

def run():
    print(f"\n{'='*60}\n  igProspecting — Florida Event Planners\n  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n{'='*60}\n")
    rahandles = load_ran_handles()
    print(f"  Previously scraped handles: {len(ran_handles)}\n")
    init_csv()

    L = instaloader.Instaloader(download_pictures=False, download_videos=False,
        download_video_thumbnails=False, download_geotags=False,
        download_comments=False, save_metadata=False, compress_json=False, quiet=True)

    print(f"  Logging in as {USERNAME}...")
    try:
        L.login(USERNAME, PASSWORD)
        print("  Login successful.\n")
    except Exception as e:
        print(f"  LOGIN FAILED: {e}")
        return

    new_handles, total_added, total_skipped = set(), 0, 0

    for tag in HASHTAGS:
        print(f"  → #{tag}")
        try:
            hashtag = instaloader.Hashtag.from_name(L.context, tag)
            post_count = 0
            for post in hashtag.get_posts():
                if post_count >= MAX_POSTS_PER:
                    break
                owner = post.owner_username
                if owner in ran_handles or owner in new_handles:
                    post_count += 1
                    continue
                time.sleep(random.uniform(SLEEP_MIN, SLEEP_MAX))
                try:
                    profile = instaloader.Profile.from_username(L.context, owner)
                    bio = profile.biography or ""
                    passed, reason = passes_filters(profile, bio)
                    if not passed:
                        print(f"   SKIP @{owner} — {reason}")
                        ran_handles.add(owner); total_skipped += 1; post_count += 1; continue
                    last_post = get_last_post_date(profile)
                    if not is_recently_active(last_post):
                        print(f"     SKIP @{owner} — inactive > {MAX_INACTIVE} days")
                        ran_handles.add(owner); total_skipped += 1; post_count += 1; continue
                    append_to_csv({"handle": f"@{owner}", "full_name": profile.full_name,
                        "followers": profile.followers, "following": profile.followees,
                        "post_count": profile.mediacount, "bio": bio.replace("\n"," "),
                        "external_url": profile.external_url or "",
                        "last_post_date": last_post.strftime("%Y-%m-%d") if last_post else "",
                    "found_via_hashtag": f"#{tag}", "scraped_at": datetime.now().strftime("%Y-%m-%d %H:%M")})
                    new_handles.add(owner); ran_handles.add(owner); total_added += 1
                    print(f"     ADD  @{owner} ({profile.followers:,} followers)")
                except instaloader.exceptions.ProfileNotExistsException:
                    ran_handles.add(owner)
                except Exception as e:
                    print(f"     ERROR @{owner} — {e}")
                    time.sleep(random.uniform(10, 20))
                post_count += 1
        except Exception as e:
            print(f"  ERROR on #{tag} — {e}")
            time.sleep(random.uniform(15, 25))
        save_ran_handles(ran_handles)
        time.sleep(random.uniform(SLEEP_MIN * 2, SLEEP_MAX * 2))

    print(f"\n{'='*60}\n  RUN COMPLETE\n  Added: {total_added}  |  Skipped: {total_skipped}\n  Output: {OUTPUT_CSV}\n{'='*60}\n")

if __name__ == "__main__":
    run()
