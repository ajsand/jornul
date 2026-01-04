/**
 * Test script for database functionality
 * Run this to verify the data layer implementation
 *
 * Usage: Import and call testDatabase() from your app
 */

import { db } from './db';
import * as repos from './repositories';

export async function testDatabase() {
  console.log('========================================');
  console.log('Testing JournalLink Database Layer');
  console.log('========================================\n');

  try {
    // 1. Initialize database
    console.log('1. Initializing database...');
    await db.init();
    console.log('✓ Database initialized\n');

    // 2. Create media items
    console.log('2. Creating media items...');
    const item1Id = await db.createMediaItem({
      id: `test-${Date.now()}-1`,
      type: 'text',
      title: 'Test Note',
      notes: 'This is a test note',
      extracted_text: 'Sample extracted text',
    });
    console.log(`✓ Created item: ${item1Id}`);

    const item2Id = await db.createMediaItem({
      id: `test-${Date.now()}-2`,
      type: 'image',
      title: 'Test Image',
      local_uri: '/path/to/image.jpg',
    });
    console.log(`✓ Created item: ${item2Id}\n`);

    // 3. Create and attach tags
    console.log('3. Creating and attaching tags...');
    const tag1 = await db.upsertTag('work');
    const tag2 = await db.upsertTag('important');
    console.log(`✓ Created tags: ${tag1.name} (id: ${tag1.id}), ${tag2.name} (id: ${tag2.id})`);

    await db.attachTagToItem(item1Id, tag1.id, null, 'user');
    await db.attachTagToItem(item1Id, tag2.id, 0.95, 'heuristic');
    await db.attachTagToItem(item2Id, tag1.id, null, 'user');
    console.log('✓ Tags attached to items\n');

    // 4. Retrieve item with tags
    console.log('4. Retrieving item with tags...');
    const itemWithTags = await db.getMediaItem(item1Id);
    console.log(`✓ Retrieved item: ${itemWithTags?.title}`);
    console.log(`  Tags: ${itemWithTags?.tags.map(t => `${t.name} (${t.source})`).join(', ')}\n`);

    // 5. List all media items
    console.log('5. Listing all media items...');
    const allItems = await db.listMediaItems();
    console.log(`✓ Found ${allItems.length} items\n`);

    // 6. Filter by tag
    console.log('6. Filtering by tag "work"...');
    const workItems = await db.listMediaItems({ tags: ['work'] });
    console.log(`✓ Found ${workItems.length} items tagged with "work"\n`);

    // 7. List tags with counts
    console.log('7. Listing tags with usage counts...');
    const tags = await db.listTags();
    tags.forEach(tag => {
      console.log(`  - ${tag.name}: ${tag.usage_count} items`);
    });
    console.log();

    // 8. Update item
    console.log('8. Updating item...');
    await db.updateMediaItem(item1Id, {
      notes: 'Updated note content',
    });
    const updatedItem = await db.getMediaItem(item1Id);
    console.log(`✓ Updated item notes: ${updatedItem?.notes}\n`);

    // 9. Create swipe signal
    console.log('9. Creating swipe signal...');
    const signalId = await db.createSwipeSignal({
      media_item_id: item1Id,
      direction: 'like',
      category: 'favorites',
    });
    console.log(`✓ Created swipe signal: ${signalId}\n`);

    // 10. Create compare session
    console.log('10. Creating compare session...');
    const sessionId = `session-${Date.now()}`;
    await db.createCompareSession({
      id: sessionId,
      mode: 'friend',
      provider: 'openai',
    });
    await db.addItemToCompareSession(sessionId, item1Id, 'snippet');
    await db.addItemToCompareSession(sessionId, item2Id, 'title');
    const session = await db.getCompareSession(sessionId);
    console.log(`✓ Created session with ${session?.items.length} items\n`);

    // 11. Create journal entry
    console.log('11. Creating journal entry...');
    const entryId = `entry-${Date.now()}`;
    await db.createJournalEntry({
      id: entryId,
      media_item_id: item1Id,
      mood: 'happy',
      location: 'home',
      entry_date: Date.now(),
    });
    const entry = await db.getJournalEntry(entryId);
    console.log(`✓ Created journal entry: mood=${entry?.mood}, location=${entry?.location}\n`);

    // 12. Test cascade delete
    console.log('12. Testing cascade delete...');
    await db.deleteMediaItem(item2Id);
    const deletedItem = await db.getMediaItem(item2Id);
    console.log(`✓ Item deleted: ${deletedItem === null ? 'confirmed' : 'failed'}\n`);

    // 13. User metadata (legacy)
    console.log('13. Testing user metadata...');
    await db.setUserMeta('test_key', 'test_value');
    const metaValue = await db.getUserMeta('test_key');
    console.log(`✓ User meta: ${metaValue}\n`);

    // ============ V3 Schema Tests (using repositories directly) ============
    const rawDb = db.getRawDb();

    // 14. Test media_meta table
    console.log('14. Testing media_meta (v3)...');
    await repos.upsertMediaMeta(rawDb, {
      item_id: item1Id,
      width: 1920,
      height: 1080,
      duration_ms: 5000,
      ocr_status: 'pending',
      source_domain: 'example.com',
    });
    const mediaMeta = await repos.getMediaMeta(rawDb, item1Id);
    console.log(`✓ Media meta: ${mediaMeta?.width}x${mediaMeta?.height}, OCR: ${mediaMeta?.ocr_status}\n`);

    // 15. Test jobs table
    console.log('15. Testing jobs table (v3)...');
    const jobId = `job-${Date.now()}`;
    await repos.createJob(rawDb, {
      id: jobId,
      kind: 'ocr',
      payload_json: JSON.stringify({ item_id: item1Id }),
    });
    const job = await repos.getJob(rawDb, jobId);
    console.log(`✓ Created job: ${job?.id}, kind: ${job?.kind}, status: ${job?.status}`);

    await repos.markJobRunning(rawDb, jobId);
    const runningJob = await repos.getJob(rawDb, jobId);
    console.log(`✓ Job marked running: ${runningJob?.status}`);

    await repos.markJobDone(rawDb, jobId);
    const doneJob = await repos.getJob(rawDb, jobId);
    console.log(`✓ Job marked done: ${doneJob?.status}, progress: ${doneJob?.progress}\n`);

    // 16. Test swipe_media table
    console.log('16. Testing swipe_media table (v3)...');
    const swipeMediaId = `swipe-media-${Date.now()}`;
    await repos.createSwipeMedia(rawDb, {
      id: swipeMediaId,
      title: 'Test Movie',
      type: 'movie',
      short_desc: 'A test movie for swiping',
      popularity_score: 85,
      tags_json: JSON.stringify(['action', 'thriller']),
    });
    const swipeMedia = await repos.getSwipeMedia(rawDb, swipeMediaId);
    console.log(`✓ Created swipe media: ${swipeMedia?.title}, score: ${swipeMedia?.popularity_score}\n`);

    // 17. Test swipe_sessions and swipe_events
    console.log('17. Testing swipe sessions and events (v3)...');
    const swipeSessionId = `swipe-session-${Date.now()}`;
    await repos.createSwipeSession(rawDb, {
      id: swipeSessionId,
      filters_json: JSON.stringify({ type: 'movie' }),
    });
    const swipeSession = await repos.getSwipeSession(rawDb, swipeSessionId);
    console.log(`✓ Created swipe session: ${swipeSession?.id}`);

    const swipeEventId = `swipe-event-${Date.now()}`;
    await repos.createSwipeEvent(rawDb, {
      id: swipeEventId,
      session_id: swipeSessionId,
      media_id: swipeMediaId,
      decision: 'like',
      strength: 0.9,
    });
    const swipeEvents = await repos.listSwipeEvents(rawDb, { session_id: swipeSessionId });
    console.log(`✓ Created swipe event, decision: ${swipeEvents[0]?.decision}, strength: ${swipeEvents[0]?.strength}`);

    await repos.endSwipeSession(rawDb, swipeSessionId);
    const endedSession = await repos.getSwipeSession(rawDb, swipeSessionId);
    console.log(`✓ Session ended: ${endedSession?.ended_at !== null}\n`);

    // 18. Test session_ledger table
    console.log('18. Testing session_ledger table (v3)...');
    const ledgerId = `ledger-${Date.now()}`;
    await repos.createSessionLedger(rawDb, {
      id: ledgerId,
      mode: 'friend',
      provider: 'openai',
      token_estimate: 1500,
      cost_estimate_cents: 2,
      sensitive_included: false,
    });
    const ledger = await repos.getSessionLedger(rawDb, ledgerId);
    console.log(`✓ Created ledger: mode=${ledger?.mode}, tokens=${ledger?.token_estimate}, cost=${ledger?.cost_estimate_cents}¢\n`);

    // 19. Test tag enhancements (slug, kind)
    console.log('19. Testing tag enhancements (v3)...');
    const enhancedTag = await repos.upsertTag(rawDb, 'Machine Learning', 'emergent');
    console.log(`✓ Enhanced tag: name="${enhancedTag.name}", slug="${enhancedTag.slug}", kind="${enhancedTag.kind}"\n`);

    // 20. Test pending jobs query
    console.log('20. Testing pending jobs query...');
    const pendingJobId = `pending-job-${Date.now()}`;
    await repos.createJob(rawDb, { id: pendingJobId, kind: 'asr' });
    const pendingJobs = await repos.listPendingJobs(rawDb);
    console.log(`✓ Pending jobs count: ${pendingJobs.length}\n`);

    // 21. Test swipe decision counts
    console.log('21. Testing swipe decision counts...');
    const decisionCounts = await repos.countSwipeEventsByDecision(rawDb, swipeSessionId);
    console.log(`✓ Decision counts: like=${decisionCounts.like}, dislike=${decisionCounts.dislike}, skip=${decisionCounts.skip}\n`);

    console.log('========================================');
    console.log('All tests passed! ✓');
    console.log('========================================');

    return {
      success: true,
      message: 'All database tests passed successfully',
    };
  } catch (error: any) {
    console.error('========================================');
    console.error('Test failed:', error.message);
    console.error('========================================');
    return {
      success: false,
      message: error.message,
      error,
    };
  }
}








