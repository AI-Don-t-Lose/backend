-- 1. 테스트 사용자 생성
INSERT INTO auth (id, external_id, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'test-user-001', NOW(), NOW());

-- 2. 테스트 상점들 생성 (카테고리 없이!)
INSERT INTO stores (id, store_name, created_at, updated_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', '스타벅스 강남점', NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440002', '맥도날드 홍대점', NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440003', '지하철', NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440004', '이마트 성수점', NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440005', '강남세브란스병원', NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440006', 'CGV 강남점', NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440007', '올리브영 명동점', NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440008', '택시', NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440009', '롯데마트 잠실점', NOW(), NOW()),
('650e8400-e29b-41d4-a716-44665544000a', '투썸플레이스 판교점', NOW(), NOW());

-- 3. 전월 소비내역 생성 (현재 기준 전월, UTC) - 다양한 상점들
INSERT INTO consumptions (id, purchase_time, amount, store_id, auth_id)
SELECT
    gen_random_uuid(),
    -- 전월 1일부터 말일까지 랜덤 날짜와 시간 (UTC 기준)
    date_trunc('month', (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 month') +
    (random() * (date_trunc('month', (NOW() AT TIME ZONE 'UTC')) - date_trunc('month', (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 month')))::interval +
    (random() * 24)::int * interval '1 hour' +
    (random() * 60)::int * interval '1 minute',
    -- 고정 금액들 (각 상점별 특성에 맞는 금액)
    consumption_data.amount,
    consumption_data.store_id,
    '550e8400-e29b-41d4-a716-446655440000'
FROM (
    VALUES
    -- 스타벅스 구매들
    (5500, '650e8400-e29b-41d4-a716-446655440001'::uuid),
    (7200, '650e8400-e29b-41d4-a716-446655440001'::uuid),
    (6800, '650e8400-e29b-41d4-a716-446655440001'::uuid),

    -- 맥도날드 구매들
    (8900, '650e8400-e29b-41d4-a716-446655440002'::uuid),
    (12500, '650e8400-e29b-41d4-a716-446655440002'::uuid),

    -- 지하철 교통비
    (1370, '650e8400-e29b-41d4-a716-446655440003'::uuid),
    (1370, '650e8400-e29b-41d4-a716-446655440003'::uuid),
    (1370, '650e8400-e29b-41d4-a716-446655440003'::uuid),

    -- 택시비
    (15400, '650e8400-e29b-41d4-a716-446655440008'::uuid),
    (12800, '650e8400-e29b-41d4-a716-446655440008'::uuid),

    -- 이마트 쇼핑
    (45600, '650e8400-e29b-41d4-a716-446655440004'::uuid),
    (67800, '650e8400-e29b-41d4-a716-446655440004'::uuid),

    -- 롯데마트 쇼핑
    (89300, '650e8400-e29b-41d4-a716-446655440009'::uuid),

    -- 올리브영
    (23500, '650e8400-e29b-41d4-a716-446655440007'::uuid),
    (31200, '650e8400-e29b-41d4-a716-446655440007'::uuid),

    -- 병원비
    (25000, '650e8400-e29b-41d4-a716-446655440005'::uuid),

    -- 영화관
    (14000, '650e8400-e29b-41d4-a716-446655440006'::uuid),
    (16500, '650e8400-e29b-41d4-a716-446655440006'::uuid),

    -- 투썸플레이스
    (8900, '650e8400-e29b-41d4-a716-44665544000a'::uuid),
    (12400, '650e8400-e29b-41d4-a716-44665544000a'::uuid)
) AS consumption_data(amount, store_id);

-- 결과 확인
SELECT
    '✅ Seed data created!' as status,
    COUNT(*) as last_month_transactions,
    SUM(amount) as total_spent,
    to_char(date_trunc('month', (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 month'), 'YYYY-MM') as target_month
FROM consumptions
WHERE auth_id = '550e8400-e29b-41d4-a716-446655440000'
  AND purchase_time >= date_trunc('month', (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 month')
  AND purchase_time < date_trunc('month', (NOW() AT TIME ZONE 'UTC'));