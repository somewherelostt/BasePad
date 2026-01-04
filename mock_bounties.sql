-- Clean up existing mock data to avoid unique constraint errors if re-run
DELETE FROM submissions WHERE content LIKE '%mock%';
DELETE FROM bounties WHERE tx_hash LIKE '%mock%';
DELETE FROM profiles WHERE wallet_address LIKE '0x%';

-- 1. Create Mock Profiles (Identity System)
INSERT INTO profiles (wallet_address, username, bio, created_at)
VALUES
  ('0x1111111111111111111111111111111111111111', 'GoogleWeb3', 'Official Google Web3 Innovation Lab. Building the future of decentralized search and AI.', NOW()),
  ('0x2222222222222222222222222222222222222222', 'SpotifyOnChain', 'Spotify Decentralized Music Initiative. Empowering artists through on-chain royalties.', NOW()),
  ('0x3333333333333333333333333333333333333333', 'Netflix_Dev', 'Netflix Engineering. Exploring decentralized content delivery networks.', NOW()),
  ('0x4444444444444444444444444444444444444444', 'Base_Core_Team', 'Building Base. The global onchain economy.', NOW()),
  ('0x5555555555555555555555555555555555555555', 'Stellar_India', 'Stellar India Community. Fostering innovation in the Indian Web3 ecosystem.', NOW()),
  ('0xaaaaabbbbbcccccdddddeeeeefffff0000011111', 'TopHunter_X', 'Elite Bug Hunter & content creator. 5x Hackathon Winner.', NOW()),
  ('0xbbbbbaaaaacccccdddddeeeeefffff0000022222', 'DesignGod', 'Award-winning UI/UX Designer specialized in Brutalism.', NOW()),
  ('0xcccccbbbbbaaaaadddddeeeeefffff0000033333', 'AnonCoder', 'Smart Contract Auditor. Saving protocols one line at a time.', NOW());

-- 2. Create Bounties (Using Valid UUIDs)
INSERT INTO bounties (id, title, description, prize, prizes, creator_address, status, is_featured, created_at, tx_hash)
VALUES
  (
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    'Design Google''s Web3 Identity System',
    'Create a cohesive visual identity system used across our new decentralized products. Must include logo, typography, and color palette.',
    '15000',
    '[{"rank": 1, "amount": "10000"}, {"rank": 2, "amount": "3000"}, {"rank": 3, "amount": "2000"}]'::jsonb,
    '0x1111111111111111111111111111111111111111',
    'OPEN',
    true,
    NOW() - interval '2 hours',
    '0xmock_google_tx'
  ),
  (
    'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
    'Spotify Artist Splits Smart Contract Audit',
    'We need a thorough security audit of our new Royalty Splitter contract. Focus on reentrancy and integer overflow vulnerabilities.',
    '5000',
    '[{"rank": 1, "amount": "5000"}]'::jsonb,
    '0x2222222222222222222222222222222222222222',
    'OPEN',
    true,
    NOW() - interval '5 hours',
    '0xmock_spotify_tx'
  ),
  (
    'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    'Base "Onchain Summer" Video Contest',
    'Create a short, high-energy video showcasing the spirit of Onchain Summer. The best 3 videos will be faetured on our homepage.',
    '2500',
    '[{"rank": 1, "amount": "1500"}, {"rank": 2, "amount": "750"}, {"rank": 3, "amount": "250"}]'::jsonb,
    '0x4444444444444444444444444444444444444444',
    'PAID',
    true,
    NOW() - interval '5 days',
    '0xmock_base_tx'
  ),
  (
    'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    'Decentralized Streaming POC using IPFS',
    'Build a Proof of Concept demo showing how video segments can be retrieved from IPFS and played in a standard HTML5 player.',
    '8000',
    '[{"rank": 1, "amount": "5000"}, {"rank": 2, "amount": "3000"}]'::jsonb,
    '0x3333333333333333333333333333333333333333',
    'OPEN',
    false,
    NOW() - interval '1 day',
    '0xmock_netflix_tx'
  ),
  (
    'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5',
    'Stellar Singularity Merch Design',
    'Design a hoodie and sticker pack for our upcoming hackathon. Must be cyberpunk/space themed.',
    '500',
    '[{"rank": 1, "amount": "500"}]'::jsonb,
    '0x5555555555555555555555555555555555555555',
    'PAID',
    false,
    NOW() - interval '1 week',
    '0xmock_stellar_tx'
  );

-- 3. Create Submissions (Using Valid UUIDs linked to Bounties)

-- For Base Bounty (PAID, 3 Winners)
INSERT INTO submissions (id, bounty_id, hunter_address, content, contact, is_public, prize_won, rank, created_at)
VALUES
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f601', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '0xaaaaabbbbbcccccdddddeeeeefffff0000011111', 'Here is my high-energy video for Onchain Summer! https://youtube.com/...', 'top_hunter_x', true, 1500, 1, NOW() - interval '4 days'),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f602', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '0xbbbbbaaaaacccccdddddeeeeefffff0000022222', 'Animated explainer video about Base L2.', 'design_god', true, 750, 2, NOW() - interval '3 days'),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f603', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '0xcccccbbbbbaaaaadddddeeeeefffff0000033333', 'Shortform TikTok style video.', 'anon_coder', true, 250, 3, NOW() - interval '2 days');

-- For Stellar Bounty (PAID, 1 Winner)
INSERT INTO submissions (id, bounty_id, hunter_address, content, contact, is_public, prize_won, rank, created_at)
VALUES
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f604', 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', '0xbbbbbaaaaacccccdddddeeeeefffff0000022222', 'Neon-brutalist tee shirt designs attached.', 'design_god', true, 500, 1, NOW() - interval '6 days');

-- For Google Bounty (OPEN, Some submissions)
INSERT INTO submissions (id, bounty_id, hunter_address, content, contact, is_public, prize_won, rank, created_at)
VALUES
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f605', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '0xcccccbbbbbaaaaadddddeeeeefffff0000033333', 'Proposal for DID integration using ENS wrapper.', 'anon_coder', false, 0, null, NOW() - interval '1 hour');

-- 4. Set Winners JSONB for Paid Bounties (Referencing matching UUIDs)

-- Base Bounty Winners
UPDATE bounties
SET winners = '[
  {"rank": 1, "amount": "1500", "submission_id": "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f601", "hunter_address": "0xaaaaabbbbbcccccdddddeeeeefffff0000011111"},
  {"rank": 2, "amount": "750", "submission_id": "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f602", "hunter_address": "0xbbbbbaaaaacccccdddddeeeeefffff0000022222"},
  {"rank": 3, "amount": "250", "submission_id": "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f603", "hunter_address": "0xcccccbbbbbaaaaadddddeeeeefffff0000033333"}
]'::jsonb,
winner_address = '0xaaaaabbbbbcccccdddddeeeeefffff0000011111' -- Primary winner display
WHERE id = 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3';

-- Stellar Bounty Winners
UPDATE bounties
SET winners = '[
  {"rank": 1, "amount": "500", "submission_id": "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f604", "hunter_address": "0xbbbbbaaaaacccccdddddeeeeefffff0000022222"}
]'::jsonb,
winner_address = '0xbbbbbaaaaacccccdddddeeeeefffff0000022222'
WHERE id = 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5';
