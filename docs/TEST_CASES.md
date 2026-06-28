# pip install — Test Cases Documentation (MS2)

## How to Run Tests

All tests below are **manual integration tests** run on the live app at:

- Local: `http://localhost:5173` (run `npm run dev`)
- Production: `https://pip-install.vercel.app`

test accounts uses:
`jamiecky5@gmail.com`
`jamiecky55@gmail.com`

## 1. Authentication Tests

### TC-AUTH-01: Google Sign-In

**Steps:**

1. Open the app
2. Click "Continue with Google"
3. Select a Google account

**Expected:** User is redirected to `/home` (returning user) or `/create-profile` (new user)  
**Status:** ok

### TC-AUTH-02: Email Sign Up

**Steps:**

1. Click "New here? Create an account ->"
2. Enter email: `test1@test.com`, password: `password123`, confirm: `password123`
3. Click "Create Account"

**Expected:** Account created, redirected to Create Profile  
**Status:** ok

### TC-AUTH-03: Email Sign Up — Password Mismatch

**Steps:**

1. Click "New here? Create an account ->"
2. Enter password: `password123`, confirm: `different123`
3. Click "Create Account"

**Expected:** Error message "Passwords don't match!"  
**Status:** ok

### TC-AUTH-04: Email Sign Up — Short Password

**Steps:**

1. Enter password with fewer than 6 characters
2. Click "Create Account"

**Expected:** Error message "Password must be at least 6 characters!"  
**Status:** ok

### TC-AUTH-05: Email Login — Wrong Password

**Steps:**

1. Click "Log in with Email"
2. Enter correct email, wrong password
3. Click "Log In"

**Expected:** Error message "Wrong password. Try again!"  
**Status:** ok

### TC-AUTH-06: Session Persistence

**Steps:**

1. Log in to the app
2. Close the browser tab
3. Reopen the app URL

**Expected:** User remains logged in, no need to re-authenticate  
**Status:** ok

### TC-AUTH-07: Refresh on Deployed Site

**Steps:**

1. Navigate to any page (e.g. `/home`, `/groups`)
2. Press browser refresh (F5 / Cmd+R)

**Expected:** Page reloads correctly, no 404 error  
**Status:** ok (requires `vercel.json` rewrite rule)

## 2. Profile Tests

### TC-PROFILE-01: Create Profile

**Steps:**

1. Sign up as new user
2. Fill in username, major, year
3. Add 2+ interests
4. Click "Save Profile"

**Expected:** Profile saved, redirected to Home page  
**Status:** ok

### TC-PROFILE-02: Create Profile — Missing Required Fields

**Steps:**

1. Leave username blank
2. Click "Save Profile"

**Expected:** Alert "Please fill in all required fields!"  
**Status:** ok

### TC-PROFILE-03: Upload Photo Avatar

**Steps:**

1. Go to Edit Profile
2. Tap avatar -> "Upload a photo"
3. Select an image file

**Expected:** Image resized to 200×200, saved as Base64, displayed in profile  
**Status:** ok

### TC-PROFILE-04: Build Cartoon Avatar

**Steps:**

1. Go to Edit Profile
2. Tap avatar -> "Build Cartoon Avatar"
3. Change skin tone, hair style, eye colour
4. Click "Save"

**Expected:** Cartoon avatar rendered and saved, displayed in profile  
**Status:** ok

### TC-PROFILE-05: Edit Profile

**Steps:**

1. Go to Home -> Edit profile
2. Change bio and add a new interest
3. Click "Save"

**Expected:** Changes reflected immediately on Home page  
**Status:** ok

### TC-PROFILE-06: Interest Normalisation

**Steps:**

1. Add interest "AI"
2. Another user adds interest "ai"
3. Run matching

**Expected:** Both users are considered to share the same interest  
**Status:** ok

## 3. Matching Algorithm Tests

### TC-MATCH-01: Random Match — Compatible Group Exists

**Pre-condition:** User A has interest "basketball". Group exists with interest "basketball" and fewer than 6 members.

**Steps:**

1. Log in as User A
2. Go to Explore -> click "Match me"

**Expected:** User A joins the basketball group, navigated to group chat  
**Status:** ok

### TC-MATCH-02: Random Match — No Compatible Group

**Pre-condition:** User has unique interest with no existing groups.

**Steps:**

1. Go to Explore -> click "Match me"

**Expected:** New group created, message "Group created! Waiting for others..."  
**Status:** ok

### TC-MATCH-03: Max Groups Limit

**Pre-condition:** User is already in 5 groups (default limit).

**Steps:**

1. Go to Explore -> click "Match me"

**Expected:** Error message "You're in 5 groups — leave one first!"  
**Status:** ok

### TC-MATCH-04: Distinct Group Names

**Steps:**

1. Run matching for multiple users
2. Check group names created

**Expected:** Names follow format "{Interest} {Adjective} {Noun}" e.g. "AI Cosmic Squad"  
**Status:** ok

### TC-MATCH-05: Max Members Per Group

**Pre-condition:** Group already has 6 members.

**Steps:**

1. Try to join the full group from Explore

**Expected:** Button shows "Full", cannot join  
**Status:** ok

## 4. Group Chat Tests

### TC-CHAT-01: Send Message

**Steps:**

1. Open any group with 2+ members
2. Type a message and press Enter (or tap send button)

**Expected:** Message appears instantly in chat for all members  
**Status:** ok

### TC-CHAT-02: Real-time Sync

**Steps:**

1. Open same group on two different devices/browsers
2. Send message from Device A

**Expected:** Message appears on Device B within 1 second  
**Status:** ok

### TC-CHAT-03: Message Grouping

**Steps:**

1. Send 3 consecutive messages from the same user

**Expected:** Sender name shown only on first message, avatar shown only on last message  
**Status:** ok

### TC-CHAT-04: System Message on Leave

**Steps:**

1. User A is in a group with User B
2. User A clicks Leave Group (🚪)

**Expected:** System message "User A has left the group 👋" appears in chat  
**Status:** ok

### TC-CHAT-05: Topic of the Moment

**Steps:**

1. Open any group chat
2. Tap ↺ refresh button on topic card

**Expected:** New conversation topic generated based on group's shared interests  
**Status:** ok

### TC-CHAT-06: Chat History — New Member Cannot See Old Messages

**Pre-condition:**

- Group has existing messages
- `historyForAll` is OFF (default)

**Steps:**

1. New user joins the group
2. New user opens the chat

**Expected:** New user only sees messages sent after they joined  
**Status:** ok

### TC-CHAT-07: Chat History — Admin Enables History

**Pre-condition:** Group has existing messages, new member cannot see them.

**Steps:**

1. Admin opens Group Info
2. Toggle "Chat History for New Members" ON
3. New member refreshes chat

**Expected:** New member can now see all past messages  
**Status:** ok

### TC-CHAT-08: Tap Member Avatar

**Steps:**

1. In group chat, tap another member's avatar

**Expected:** Member profile modal opens showing their info  
**Status:** ok

## 5. Group Info Tests

### TC-INFO-01: Navigate to Group Info

**Steps:**

1. In group chat, tap the group name/photo in header

**Expected:** Group Info page opens  
**Status:** ok

### TC-INFO-02: Rename Group

**Steps:**

1. Open Group Info
2. Tap pencil icon next to group name
3. Type new name, click Save

**Expected:** Group name updated everywhere (chat header, messages list)  
**Status:** ok

### TC-INFO-03: Random Group Name

**Steps:**

1. Open Group Info -> tap ✎
2. Click "🎲 Random"

**Expected:** Name auto-generated in "{Interest} {Adjective} {Noun}" format  
**Status:** ok

### TC-INFO-04: Change Group Photo

**Steps:**

1. Open Group Info
2. Tap ✎ on group avatar
3. Upload a photo or build cartoon

**Expected:** Group photo updated in Group Info, group chat header, and Messages list  
**Status:** ok

### TC-INFO-05: Leave Group

**Steps:**

1. Open Group Info -> tap "Leave Group"
2. Confirm in dialog

**Expected:** User removed from group, redirected to Messages, system message sent to chat  
**Status:** ok

### TC-INFO-06: Admin Transfer on Leave

**Pre-condition:** User is admin of group.

**Steps:**

1. Admin leaves the group

**Expected:** Admin role automatically transferred to next member  
**Status:** ok

## 6. Explore Tests

### TC-EXPLORE-01: Search Groups

**Steps:**

1. Go to Explore
2. Type "basketball" in search bar

**Expected:** Only groups with "basketball" in name or interests shown  
**Status:** ok

### TC-EXPLORE-02: For You Tab

**Steps:**

1. Go to Explore -> For You tab

**Expected:** Only shows groups matching user's interests, not full, not already joined  
**Status:** ok

### TC-EXPLORE-03: Create Interest Group

**Steps:**

1. Go to Explore -> tap "Create"
2. Enter name "Basketball Fans SG" and topics "basketball, sports"
3. Click "Create Group"

**Expected:** Group created, user becomes admin, navigated to group chat  
**Status:** ok

### TC-EXPLORE-04: Join Group

**Steps:**

1. Go to Explore -> All Groups tab
2. Tap "Join" on any group

**Expected:** User joins group, navigated to chat, memberJoinedAt timestamp saved  
**Status:** ok

## 7. Friends Tests

### TC-FRIENDS-01: Send Friend Request

**Steps:**

1. In group chat, tap another member's avatar
2. Tap "➕ Add Friend"

**Expected:** Friend request sent, button changes to "Request Sent"  
**Status:** ok

### TC-FRIENDS-02: Accept Friend Request

**Steps:**

1. Log in as User B (who received request)
2. Go to Community tab
3. Tap the request -> tap "Accept"

**Expected:** Friendship created, both users can see each other's Telegram handles  
**Status:** ok

### TC-FRIENDS-03: Telegram Handle Privacy

**Pre-condition:** Two users are NOT friends.

**Steps:**

1. Tap member profile modal

**Expected:** Telegram handle hidden, lock icon shown  
**Status:** ok

### TC-FRIENDS-04: Private Chat

**Steps:**

1. Go to Community tab
2. Tap 💬 next to a friend

**Expected:** Private chat opens, messages only visible to the two users  
**Status:** ok

## 8. Video Call Tests

### TC-VIDEO-01: Start Video Call

**Steps:**

1. Go to Group Info -> tap 📹 Call
2. Tap "Join Call"

**Expected:** Jitsi Meet opens in new tab with correct room URL  
**Status:** ok

### TC-VIDEO-02: System Message Sent

**Steps:**

1. Start a video call from Group Info

**Expected:** System message appears in group chat with the room link  
**Status:** ok

### TC-VIDEO-03: Copy Room Link

**Steps:**

1. Open video call modal
2. Tap 📋 Copy

**Expected:** Room URL copied to clipboard  
**Status:** ok

## 9. Mini Games Tests

### TC-GAME-01: Start Would You Rather

**Steps:**

1. Go to Group Info -> tap 🎮 Games
2. Tap "Would You Rather"

**Expected:** Random scenario shown to all group members simultaneously  
**Status:** ok

### TC-GAME-02: Vote in Would You Rather

**Steps:**

1. Tap Option A or B

**Expected:** Vote registered, percentage bars shown, +2 🪙 coins awarded  
**Status:** ok

### TC-GAME-03: Real-time Vote Sync

**Steps:**

1. User A and User B both have the game open
2. User A votes A

**Expected:** User B's screen updates immediately showing User A's vote  
**Status:** ok

### TC-GAME-04: Start Trivia

**Steps:**

1. Go to Games -> tap "Trivia Quiz"

**Expected:** Random question with 4 options shown to all members  
**Status:** ok

### TC-GAME-05: Answer Trivia — Correct

**Steps:**

1. Select the correct answer
2. Tap "Reveal Answer"

**Expected:** Correct answer highlighted green, +3 🪙 for playing + +10 🪙 for correct answer  
**Status:** ok

### TC-GAME-06: Answer Trivia — Wrong

**Steps:**

1. Select a wrong answer
2. Tap "Reveal Answer"

**Expected:** Your answer highlighted red, correct answer highlighted green, +3 🪙 for playing only  
**Status:** ok

## 10. Calendar Tests

### TC-CAL-01: Add Group Event

**Steps:**

1. Go to Group Info -> tap Calendar
2. Tap any date -> tap "+ Add"
3. Enter title "Basketball at UTown", time "14:00", location "UTown Sports Hall"
4. Click "Add to Calendar"

**Expected:** Event appears on selected date in group calendar  
**Status:** ok

### TC-CAL-02: Event Synced to Personal Calendar

**Steps:**

1. Add an event to a group calendar (TC-CAL-01)
2. Go to Home -> tap 📅

**Expected:** Same event appears in personal calendar tagged "From group chat"  
**Status:** ok

### TC-CAL-03: Delete Event

**Steps:**

1. Open Group Calendar
2. Tap × on your own event

**Expected:** Event removed from group calendar  
**Status:** ok

### TC-CAL-04: Cannot Delete Other's Events

**Steps:**

1. Open Group Calendar
2. View event created by another member

**Expected:** No × delete button shown for events you did not create  
**Status:** ok

## 11. Credits System Tests

### TC-CREDITS-01: Daily Login Reward

**Steps:**

1. Log in for the first time today

**Expected:** +5 🪙 coins added to balance (only once per day)  
**Status:** ok

### TC-CREDITS-02: Daily Login — No Double Award

**Steps:**

1. Log out and log back in on the same day

**Expected:** No additional coins awarded  
**Status:** ok

### TC-CREDITS-03: Earn Coins from WYR

**Steps:**

1. Vote in Would You Rather game

**Expected:** +2 🪙 coins added, coin toast notification appears  
**Status:** ok

### TC-CREDITS-04: Earn Coins from Trivia

**Steps:**

1. Participate in Trivia (any answer)

**Expected:** +3 🪙 coins added  
**Status:** ok

### TC-CREDITS-05: Earn Bonus from Correct Trivia

**Steps:**

1. Select the correct Trivia answer
2. Tap Reveal Answer

**Expected:** +10 🪙 coins added on top of the +3 🪙 participation reward  
**Status:** ok

### TC-CREDITS-06: Unlock 6th Group Slot

**Pre-condition:** User has 50+ 🪙 coins.

**Steps:**

1. Go to Home -> tap 🪙 Coins
2. Tap "Unlock" next to "6th Group Slot"

**Expected:** 50 🪙 deducted, maxGroups updated to 6, can now join a 6th group  
**Status:** ok

### TC-CREDITS-07: Unlock — Insufficient Coins

**Pre-condition:** User has fewer than 50 🪙 coins.

**Steps:**

1. Go to Credits page
2. Tap "Unlock" on 6th Group Slot

**Expected:** Error "Need 50 🪙 — play games to earn more!", no coins deducted  
**Status:** ok

### TC-CREDITS-08: Max Groups Respected After Unlock

**Pre-condition:** User unlocked 6th slot (maxGroups = 6), currently in 5 groups.

**Steps:**

1. Go to Explore -> tap "Match me" or join a group

**Expected:** Successfully joins 6th group, no "max groups" error  
**Status:** ok

## 12. Theme Tests

### TC-THEME-01: Change Theme

**Steps:**

1. Go to Home -> tap 🎨
2. Select "Ocean" theme

**Expected:** All colours change instantly — background, buttons, tags, inputs  
**Status:** ok

### TC-THEME-02: Theme Persists on Refresh

**Steps:**

1. Set theme to "Emerald"
2. Refresh the page

**Expected:** Emerald theme still active after refresh  
**Status:** ok

### TC-THEME-03: Theme Persists Across Pages

**Steps:**

1. Set theme to "Crimson" on Home page
2. Navigate to Groups, Explore, Friends pages

**Expected:** Crimson theme applied on all pages  
**Status:** ok

## 13. Report Tests

### TC-REPORT-01: Report a User

**Steps:**

1. Tap any member's avatar in group chat
2. Tap 🚩 Report User
3. Select reason "Harassment"
4. Add details "Sent inappropriate messages"
5. Submit

**Expected:** Report saved to Firestore, confirmation shown  
**Status:** ok

## 14. Unread Messages Tests

### TC-UNREAD-01: Unread Badge Appears

**Steps:**

1. User A sends a message in a group
2. User B (not in chat) checks Messages tab

**Expected:** Unread badge shows number of unread messages on that group  
**Status:** ok

### TC-UNREAD-02: Badge Clears on Open

**Steps:**

1. Open the group with unread messages

**Expected:** Badge disappears after opening the chat  
**Status:** ok

### TC-UNREAD-03: Total Badge on Tab Bar

**Steps:**

1. Have unread messages in 3 different groups

**Expected:** Messages tab icon shows total unread count across all groups  
**Status:** ok

## 15. Security Tests

### TC-SEC-01: Protected Routes

**Steps:**

1. Log out
2. Try to navigate directly to `/home` or `/chat/someId`

**Expected:** Redirected to login page  
**Status:** ok

### TC-SEC-02: Telegram Handle Hidden

**Steps:**

1. View a non-friend's profile modal

**Expected:** Telegram handle not visible, lock icon shown  
**Status:** ok

### TC-SEC-03: Firestore Rules — Own Document Only

**Steps:**

1. Attempt to write to another user's Firestore document (via browser console)

**Expected:** Permission denied error from Firestore  
**Status:** ok

## Known Issues / Limitations

| Issue | Severity | Status |
| Chat history toggle requires page refresh to take effect for members already in chat | Low | In Progress |
| DiceBear avatars may not load if API is down | Low | Known |
| Very large Base64 images (close to 1MB) may slow Firestore writes | Low | Known |
| Game state not cleaned up if all users leave mid-game | Low | Known |
| No push notifications for new messages | Medium | Planned (Milestone 3) |
| No blocking feature yet | Medium | Planned (Milestone 3) |
| Matching algorithm runs client-side (scalability concern) | Medium | Moving to Cloud Functions (Milestone 3) |

## Test Environment

| Item | Details |
| Local dev URL | `http://localhost:5173` |
| Production URL | `https://pip-install.vercel.app` |
| Browser tested | Chrome 124+, Safari 17+ |
| Device tested | MacBook Air, iPhone 15 |
| Firebase project | pip-install-21154 |
| Node version | 18+ |
| npm version | 9+ |
