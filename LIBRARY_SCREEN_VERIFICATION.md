# Library Screen - Manual Verification Guide

## Prerequisites
Ensure you have some test data in the database. If not, create a few items using the "Add" tab.

## Verification Steps

### 1. **Tab Navigation**
- [ ] Launch the app
- [ ] Verify bottom navigation shows 5 tabs: **Inbox**, **Library**, **Add**, **Sync**, **Settings**
- [ ] Tap **Library** tab (second from left)
- [ ] Library screen should load

**Expected:**
- Library tab icon is a book (BookOpen icon)
- Tab highlights in primary color when active
- Screen title shows "Library" in header

---

### 2. **Initial Load & Display**
- [ ] Library screen loads data from database
- [ ] Each item shows:
  - Type icon on the left (FileText for text, Image for images, etc.)
  - Title/preview in the middle
  - Date on the right (e.g., "2 days ago" or "Jan 15")
- [ ] Items are sorted newest first by default

**Expected:**
- No crashes during load
- All items display correctly
- Type icons match item types
- Dates are formatted properly

---

### 3. **Empty State**
- [ ] If no items exist, shows empty state message
- [ ] Message says "Your Library is Empty"
- [ ] Helpful text suggests tapping + tab to create items

**Test:**
```
Clear database or use fresh install
Launch app → Library tab
Should see empty state
```

---

### 4. **Search Functionality**
- [ ] Tap the search bar at top
- [ ] Type a search query (e.g., "test")
- [ ] Results filter in real-time as you type
- [ ] Search matches title, notes, and extracted text
- [ ] Clear the search (tap X in search bar)
- [ ] All items reappear

**Expected:**
- Search is case-insensitive
- Updates immediately (no lag)
- No results shows "No results found" message with option to clear

---

### 5. **Sort Functionality**
- [ ] Tap the sort icon (up/down arrows) in header
- [ ] Menu appears with two options:
  - "Newest First" (default, has checkmark)
  - "Oldest First"
- [ ] Select "Oldest First"
- [ ] Items re-sort with oldest at top
- [ ] Open menu again, verify "Oldest First" has checkmark
- [ ] Switch back to "Newest First"

**Expected:**
- Sort persists during session
- Animation is smooth
- Menu closes after selection

---

### 6. **Item Navigation**
- [ ] Tap any item in the list
- [ ] Should navigate to item detail screen (`/item/[id]`)
- [ ] Detail screen shows full content, tags, metadata
- [ ] Tap back button
- [ ] Returns to Library screen with same scroll position

**Expected:**
- Navigation is smooth
- Detail screen loads correctly
- Back navigation works
- List state is preserved

---

### 7. **Pull to Refresh**
- [ ] Scroll to top of list
- [ ] Pull down to trigger refresh
- [ ] Loading indicator appears
- [ ] List reloads from database
- [ ] Indicator disappears

**Expected:**
- Smooth pull gesture
- Shows loading spinner
- Data refreshes successfully

---

### 8. **Search + Sort Combination**
- [ ] Enter a search query
- [ ] Toggle sort order
- [ ] Verify results are both filtered AND sorted
- [ ] Clear search
- [ ] Verify sort persists

**Expected:**
- Search and sort work together correctly
- No conflicts between filters

---

### 9. **Performance with Many Items**
- [ ] Create 20+ items (use newitem screen multiple times)
- [ ] Return to Library
- [ ] Scroll through list
- [ ] Search for items
- [ ] Toggle sort

**Expected:**
- Scrolling is smooth (FlatList virtualization works)
- Search is fast (< 500ms)
- No memory issues
- No frame drops

---

### 10. **Type Icon Verification**
Create items of different types and verify icons:
- [ ] Text items → FileText icon (document)
- [ ] Image items → Image icon (picture)
- [ ] Audio items → Music icon (note)
- [ ] Video items → Video icon (play button)
- [ ] PDF items → FileCode icon (brackets)
- [ ] URL items → Link icon (chain)

**Expected:**
- Each type has distinct, recognizable icon
- Icons are sized consistently
- Icons use primary color

---

### 11. **Edge Cases**

#### Long Titles
- [ ] Create item with very long title (100+ chars)
- [ ] Verify title truncates with ellipsis
- [ ] No layout overflow

#### No Content
- [ ] Create item with only title, no notes/text
- [ ] Verify displays correctly
- [ ] No empty/blank sections

#### Special Characters
- [ ] Create item with emojis 🎉, symbols, unicode
- [ ] Verify displays correctly
- [ ] Search works with special characters

#### Rapid Actions
- [ ] Quickly type in search bar
- [ ] Rapidly toggle sort
- [ ] Rapidly tap items
- [ ] No crashes or race conditions

---

## Console Checks

Watch for these log messages (no errors):
```
✓ Database initialized successfully
✓ Loaded X items from database
✓ Search query: [your query]
✓ Sort order: newest/oldest
```

**Warning signs:**
- ❌ "Failed to load items"
- ❌ "Database not initialized"
- ❌ Any TypeScript type errors
- ❌ Unhandled promise rejections

---

## Regression Tests

Verify existing functionality still works:

- [ ] **Inbox tab** (index.tsx) still works
- [ ] **Add tab** (newitem.tsx) creates items successfully
- [ ] **Created items appear in Library**
- [ ] **Sync tab** still loads
- [ ] **Settings tab** still loads
- [ ] **Item detail from Inbox** still works
- [ ] **Item detail from Library** still works

---

## Cross-Platform Check

Test on both platforms if possible:

### iOS
- [ ] Library tab loads
- [ ] Search bar styling correct
- [ ] Pull-to-refresh works
- [ ] Navigation smooth

### Android
- [ ] Library tab loads
- [ ] Search bar styling correct
- [ ] Pull-to-refresh works
- [ ] Navigation smooth
- [ ] Back button works correctly

---

## Success Criteria

All checkboxes above should be ✅ with:
- Zero crashes
- Zero linter errors
- Zero console errors
- Smooth 60fps performance
- Intuitive UX

---

## Troubleshooting

### "No items found" but items exist
- Check database initialized: `await db.init()`
- Verify using new API: `db.listMediaItems()` not old `queryAllItems()`
- Check console for errors

### Search not working
- Verify searchText parameter passed to `db.listMediaItems()`
- Check search matches title/notes/extracted_text fields
- Test with simple query first (e.g., single letter)

### Sort not applying
- Verify `orderBy: 'created_at'` and `orderDirection` parameters
- Check state updates correctly
- Verify useEffect dependencies include sortOrder

### Icons not showing
- Check lucide-react-native installed
- Verify TypeIcon component imported
- Test each media type individually

### Detail view broken
- Check compatibility layer in item/[id].tsx
- Verify both JournalItem and MediaItemWithTags handled
- Check getMediaTitle helper function

---

## Next Steps After Verification

Once all tests pass:
1. ✅ Feature is complete
2. Create test items with various types
3. Test with realistic content (100+ items)
4. Get user feedback on UX
5. Monitor performance metrics
6. Consider implementing additional features (see tech debt below)




