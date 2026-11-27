-- ============================================================
-- 台中週末跑咖與戶外配對 (Taichung Weekend Hiking & Dating) - Supabase Schema
-- 專案: taichung-dating-mvp
-- 說明: 請複製此 SQL 到 Supabase 網頁的 SQL Editor 並按下 Run 即可完成建表
-- ============================================================

-- ============================================================
-- 1. 建立 profiles 資料表（會員資料）
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname TEXT NOT NULL,
    age INTEGER NOT NULL,
    district TEXT NOT NULL,
    bio TEXT,
    tags TEXT[],
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. 建立 likes 資料表（按讚紀錄）
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- ============================================================
-- 3. 建立 messages 資料表（配對聊天室訊息）
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. 初始化 4 位台中主題示範角色資料
-- ============================================================
-- 台中北屯區 - 大雄（登山達人）
INSERT INTO profiles (nickname, age, district, bio, tags, avatar_url, created_at)
VALUES (
    '大雄',
    26,
    '北屯區',
    '每週至少爬一座山！對於任何登山路線都充滿熱情。也喜歡拍攝風景，期待和你一起發現台中美麗的角落。',
    ARRAY['登山', '風景攝影', '徒步旅行', '徒步', '爬山'],
    'https://i.pravatar.me/150?img=12',
    NOW()
);

-- 台中西屯區 - 美玉（休閒運動）
INSERT INTO profiles (nickname, age, district, bio, tags, avatar_url, created_at)
VALUES (
    '美玉',
    24,
    '西屯區',
    '熱愛生活，喜歡在周末一起爬山、拍照、吃美食。有一個好的伴侶能讓每一天都更精彩！',
    ARRAY['爬山', '運動', '美食', '攝影', '旅行'],
    'https://i.pravatar.me/150?img=32',
    NOW()
);

-- 台中南屯區 - 志堅（自然探索者）
INSERT INTO profiles (nickname, age, district, bio, tags, avatar_url, created_at)
VALUES (
    '志堅',
    28,
    '南屯區',
    '痴迷大自然，周末總是找地方跑。希望找到一個能一起放空、聊天、探索的小夥伴。',
    ARRAY['自然', '徒步', '星空愛好者', '喝咖啡', '散步'],
    'https://i.pravatar.me/150?img=65',
    NOW()
);

-- 台中北區 - 念媛（藝術與自然愛好者）
INSERT INTO profiles (nickname, age, district, bio, tags, avatar_url, created_at)
VALUES (
    '念媛',
    25,
    '北區',
    '喜歡用相機記錄每一個細微之處，重視生活的品質。期待遇到有趣的人一起慢跑、拍照、探險。',
    ARRAY['攝影', '慢跑', '藝術', '咖啡店', '攝影'],
    'https://i.pravatar.me/150?img=98',
    NOW()
);

-- ============================================================
-- 5. 資料表權限設定（RLS Policies）
-- ============================================================

-- 1. profiles 表
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 允許公開查看所有 profiles（好友/推薦資料）
CREATE POLICY "Anyone can view profiles" ON profiles
    FOR SELECT
    USING (true);

-- 允許本戶會員更新自己的資料
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- 2. likes 表
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 允許使用者查看likes，但無法新增/更新/刪除（由應用程式控制）
CREATE POLICY "Users can view likes" ON likes
    FOR SELECT
    USING (true);

-- 3. messages 表
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 允許使用者查看自己發送或接收的訊息
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT
    USING (
        auth.uid() = sender_id OR
        auth.uid() = receiver_id
    );

-- 允許使用者新增訊息
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- 允許使用者刪除自己的訊息
CREATE POLICY "Users can delete own messages" ON messages
    FOR DELETE
    USING (auth.uid() = sender_id);

-- ============================================================
-- 6. 為profiles表設置基本 unique 限制（可選）
-- ============================================================
-- 若要限制暱稱唯一，可取消以下兩行並重新運行

-- CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_nickname_unique ON profiles(nickname);
