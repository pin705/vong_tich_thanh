import { parseMessageIntoSpans, createStructuredMessage } from './server/utils/messageParser';

console.log('Testing Message Parser...\n');

// Test 1: Simple message with NPC name
const test1 = "Một [Lính Gác] đang đứng đây.";
const result1 = parseMessageIntoSpans(test1);
console.log('Test 1: NPC mention');
console.log('Input:', test1);
console.log('Result:', JSON.stringify(result1, null, 2));
console.log('Expected: 3 spans - "Một ", "[Lính Gác]" (highlight), " đang đứng đây."');
console.log('---\n');

// Test 2: Combat message with damage
const test2 = "Bạn gây 25 sát thương lên [Chuột Hoang].";
const result2 = parseMessageIntoSpans(test2);
console.log('Test 2: Damage message');
console.log('Input:', test2);
console.log('Result:', JSON.stringify(result2, null, 2));
console.log('Expected: Multiple spans with "25 sát thương" as damage category');
console.log('---\n');

// Test 3: Healing message
const test3 = "Bạn hồi 15 HP.";
const result3 = parseMessageIntoSpans(test3);
console.log('Test 3: Healing message');
console.log('Input:', test3);
console.log('Result:', JSON.stringify(result3, null, 2));
console.log('Expected: "15 HP" as heal category');
console.log('---\n');

// Test 4: XP gain
const test4 = "Bạn nhận được 100 XP.";
const result4 = parseMessageIntoSpans(test4);
console.log('Test 4: XP gain');
console.log('Input:', test4);
console.log('Result:', JSON.stringify(result4, null, 2));
console.log('Expected: "100 XP" as xp category');
console.log('---\n');

// Test 5: Gold loot
const test5 = "Bạn nhặt được 50 vàng.";
const result5 = parseMessageIntoSpans(test5);
console.log('Test 5: Gold loot');
console.log('Input:', test5);
console.log('Result:', JSON.stringify(result5, null, 2));
console.log('Expected: "50 vàng" as loot category');
console.log('---\n');

// Test 6: Structured message
const test6 = createStructuredMessage("Một [Lính Gác] đang đứng đây.", 'normal');
console.log('Test 6: Structured message');
console.log('Result:', JSON.stringify(test6, null, 2));
console.log('Expected: type="structured-message", messageType="normal", spans array');
console.log('---\n');

// Test 7: Plain text without patterns
const test7 = "Bạn đang ở trong một căn phòng.";
const result7 = parseMessageIntoSpans(test7);
console.log('Test 7: Plain text');
console.log('Input:', test7);
console.log('Result:', JSON.stringify(result7, null, 2));
console.log('Expected: Single span with default category');
console.log('---\n');

console.log('\n✅ All tests completed!');
