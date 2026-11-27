// ============================================================
// 台中週末跑咖 - 戶外配對交友系統
// ============================================================

// Supabase 配置（來自 AGENT_IDENTITIES.json）
const supabaseConfig = {
    url: 'https://kvicwvqirfygnvqrzhah.supabase.co',
    publishableKey: 'sb_publishable_f0zl8u-g5aUnvODo_UoQlg_Io7dRsA3'
};

// 初始化 Supabase
let supabase = supabaseClient(supabaseConfig.url, supabaseConfig.publishableKey);

// 狀態管理
const state = {
    currentUser: null,
    currentProfile: null,
    selectedProfile: null,
    likedProfiles: new Set(),
    likedByOthers: new Set(),
    pendingLikes: new Set(),
    isGuestMode: false
};

// 4位台中主題虛擬示範角色（固定資料）
const demoProfiles = [
    {
        id: 'demo_1',
        nickname: '大雄',
        age: 26,
        district: '北屯區',
        bio: '每週至少爬一座山！對於任何登山路線都充滿熱情。也喜歡拍攝風景，期待和你一起發現台中美麗的角落。',
        tags: ['登山', '風景攝影', '徒步旅行', '徒步', '爬山'],
        avatar_url: 'https://i.pravatar.me/150?img=12',
        isDemo: true
    },
    {
        id: 'demo_2',
        nickname: '美玉',
        age: 24,
        district: '西屯區',
        bio: '熱愛生活，喜歡在周末一起爬山、拍照、吃美食。有一個好的伴侶能讓每一天都更精彩！',
        tags: ['爬山', '運動', '美食', '攝影', '旅行'],
        avatar_url: 'https://i.pravatar.me/150?img=32',
        isDemo: true
    },
    {
        id: 'demo_3',
        nickname: '志堅',
        age: 28,
        district: '南屯區',
        bio: '痴迷大自然，周末總是找地方跑。希望找到一個能一起放空、聊天、探索的小夥伴。',
        tags: ['自然', '徒步', '星空愛好者', '喝咖啡', '散步'],
        avatar_url: 'https://i.pravatar.me/150?img=65',
        isDemo: true
    },
    {
        id: 'demo_4',
        nickname: '念媛',
        age: 25,
        district: '北區',
        bio: '喜歡用相機記錄每一個細微之處，重視生活的品質。期待遇到有趣的人一起慢跑、拍照、探險。',
        tags: ['攝影', '慢跑', '藝術', '咖啡店', '攝影'],
        avatar_url: 'https://i.pravatar.me/150?img=98',
        isDemo: true
    }
];

// DOM 元素
const el = {
    authModal: document.getElementById('authModal'),
    authTitle: document.getElementById('authTitle'),
    authForm: document.getElementById('authForm'),
    authMode: document.getElementById('authMode'),
    submitBtnText: document.getElementById('submitBtnText'),
    toggleAuthMode: document.getElementById('toggleAuthMode'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    guestBtn: document.getElementById('guestBtn'),
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn'),
    guestView: document.getElementById('guestView'),
    appView: document.getElementById('appView'),
    logoutBtn: document.getElementById('logoutBtn'),
    profileGrid: document.getElementById('profileGrid'),
    guestProfileGrid: document.getElementById('guestProfileGrid'),
    profileInfo: document.getElementById('profileInfo'),
    memberNickname: document.getElementById('memberNickname'),
    memberDistrict: document.getElementById('memberDistrict'),
    memberAge: document.getElementById('memberAge'),
    memberTags: document.getElementById('memberTags'),
    memberBio: document.getElementById('memberBio'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    chatBtn: document.getElementById('chatBtn'),
    chatModal: document.getElementById('chatModal'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendMessage: document.getElementById('sendMessage'),
    closeChat: document.getElementById('closeChat'),
    matchModal: document.getElementById('matchModal'),
    matchedNickname: document.getElementById('matchedNickname'),
    closeMatch: document.getElementById('closeMatch'),
    startExploring: document.getElementById('startExploring')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    if (state.isGuestMode) {
        showGuestView();
    } else {
        showAppView();
    }
    loadProfiles();
});

// 事件監聽
function setupEventListeners() {
    // 訪客按鈕
    el.guestBtn.addEventListener('click', () => {
        state.isGuestMode = true;
        showGuestView();
        el.authModal.classList.add('hidden');
    });

    // 登入按鈕
    el.loginBtn.addEventListener('click', () => {
        state.isGuestMode = false;
        el.authTitle.textContent = '登入帳號';
        el.authMode.value = 'login';
        el.submitBtnText.textContent = '登入';
        el.authModal.classList.remove('hidden');
    });

    // 註冊按鈕
    el.signupBtn.addEventListener('click', () => {
        state.isGuestMode = false;
        el.authTitle.textContent = '立即註冊';
        el.authMode.value = 'signup';
        el.submitBtnText.textContent = '註冊';
        el.authModal.classList.remove('hidden');
    });

    // 切換登入/註冊模式
    el.toggleAuthMode.addEventListener('click', () => {
        const currentMode = el.authMode.value;
        if (currentMode === 'login') {
            el.authMode.value = 'signup';
            el.submitBtnText.textContent = '註冊';
        } else {
            el.authMode.value = 'login';
            el.submitBtnText.textContent = '登入';
        }
    });

    // 關閉登入彈窗
    el.closeAuth = document.getElementById('closeAuth');
    el.closeAuth.addEventListener('click', () => {
        el.authModal.classList.add('hidden');
    });

    // 表單提交
    el.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = el.authMode.value;
        const email = el.email.value;
        const password = el.password.value;

        if (!email || !password) {
            alert('請填寫完整資料');
            return;
        }

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password
                });
                if (error) throw error;
                alert('註冊成功！請檢查您的電子郵件並驗證郵箱。');
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                state.currentUser = data.user;
                showAppView();
                loadProfiles();
            }
        } catch (err) {
            alert('發生錯誤: ' + err.message);
        }
    });

    // 登出按鈕
    el.logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        state.currentUser = null;
        state.currentProfile = null;
        showGuestView();
    });

    // 訪客體驗開始
    el.startExploring.addEventListener('click', () => {
        showGuestView();
        loadGuestProfiles();
    });

    // 登出按鈕
    el.logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        state.currentUser = null;
        showGuestView();
    });

    // 編輯個人資料
    el.editProfileBtn.addEventListener('click', () => {
        if (!state.currentUser) return;
        showEditProfileModal();
    });

    // 聊天按鈕
    el.chatBtn.addEventListener('click', () => {
        showChatModal();
    });

    // 關閉聊天室
    el.closeChat.addEventListener('click', () => {
        el.chatModal.classList.add('hidden');
    });

    // 關閉匹配彈窗
    el.closeMatch.addEventListener('click', () => {
        el.matchModal.classList.add('hidden');
    });

    // 發送訊息
    el.sendMessage.addEventListener('click', sendMessage);

    // 按鍵事件
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            el.authModal.classList.add('hidden');
            el.chatModal.classList.add('hidden');
            el.matchModal.classList.add('hidden');
        }
    });
}

// 顯示訪客介面
function showGuestView() {
    el.guestView.classList.remove('hidden');
    el.appView.classList.add('hidden');
}

// 顯示應用程式介面
function showAppView() {
    el.guestView.classList.add('hidden');
    el.appView.classList.remove('hidden');
}

// 加載輪播角色資料
async function loadGuestProfiles() {
    el.guestProfileGrid.innerHTML = '';
    const profileCards = demoProfiles.map(profile => createProfileCard(profile, true));
    el.guestProfileGrid.innerHTML = profileCards.join('');
}

// 載入個人檔案
async function loadProfiles() {
    if (state.isGuestMode) {
        loadGuestProfiles();
        return;
    }

    if (!state.currentUser) return;

    if (!state.currentProfile) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', state.currentUser.id)
            .single();

        if (profile) {
            state.currentProfile = profile;
            renderProfileInfo(profile);
        } else {
            // 創建新 profile
            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    id: state.currentUser.id,
                    nickname: '新會員',
                    age: 25,
                    district: '北區',
                    bio: '加入台中跑咖，期待與您相遇！',
                    tags: ['跑步', '登山'],
                    avatar_url: 'https://i.pravatar.me/150?img=55'
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating profile:', error);
            } else {
                state.currentProfile = data;
                renderProfileInfo(data);
            }
        }
    }

    loadProfileCards();
}

// 渲染個人資訊
function renderProfileInfo(profile) {
    el.memberNickname.textContent = profile.nickname || '未設定';
    el.memberDistrict.textContent = '地區: ' + (profile.district || '未設定');
    el.memberAge.textContent = '年齡: ' + (profile.age || '未設定');
    el.memberTags.innerHTML = (profile.tags || [])
        .map(tag => `<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">#${tag}</span>`)
        .join('');
    el.memberBio.textContent = profile.bio || '還沒有自我介紹';
    el.avatarPreview.src = profile.avatar_url || '';
}

// 建立個人檔案卡片
function createProfileCard(profile, isDemo = false) {
    return `
        <div class="bg-white rounded-xl shadow-md overflow-hidden transform transition hover:scale-105 hover:shadow-xl">
            <div class="relative">
                <img src="${profile.avatar_url}" alt="${profile.nickname}" class="w-full h-48 object-cover">
                <div class="absolute bottom-2 right-2 bg-white rounded-full px-3 py-1 shadow">
                    <span class="text-sm font-bold text-green-600">${profile.age}歲</span>
                </div>
            </div>
            <div class="p-4">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-lg font-bold text-gray-800">${profile.nickname}</h3>
                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">${profile.district}</span>
                </div>
                <p class="text-sm text-gray-600 mb-3">${profile.bio}</p>
                <div class="flex flex-wrap gap-1 mb-3">
                    ${(profile.tags || []).map(tag => `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">#${tag}</span>`).join('')}
                </div>
                <div class="flex space-x-2">
                    <button class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition" data-profile-id="${profile.id}">
                        ❤️ 喜歡
                    </button>
                    <button class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg transition" data-profile-id="${profile.id}">
                        ❌ 略過
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 載入所有個人檔案卡片
function loadProfileCards() {
    el.profileGrid.innerHTML = '';
    const cards = demoProfiles.map(profile => createProfileCard(profile, state.isGuestMode));
    el.profileGrid.innerHTML = cards.join('');

    // 綁定按鈕事件
    document.querySelectorAll('[data-profile-id]').forEach(btn => {
        if (btn.textContent.includes('喜歡')) {
            btn.addEventListener('click', () => handleLike(btn.dataset.profileId));
        } else {
            btn.addEventListener('click', () => handleSkip(btn.dataset.profileId));
        }
    });
}

// 處理喜歡
async function handleLike(profileId) {
    if (state.isGuestMode) {
        alert('訪客模式：自動為您發送喜歡信喔！');
    }

    // 更新本地狀態
    state.likedProfiles.add(profileId);
    el.selectedProfile = null;

    // 模擬延遲
    await sleep(500);

    // 檢查是否互相喜歡
    const { data: chat } = await supabase
        .from('likes')
        .select('*')
        .eq('from_user_id', state.currentUser?.id)
        .eq('to_user_id', 'demo_user');

    if (chat && chat.length > 0) {
        showMatchModal();
    } else {
        alert('已送出喜歡信，對方收到後會通知您喔！');
    }
}

// 處理略過
async function handleSkip(profileId) {
    if (state.isGuestMode) {
        alert('訪客模式：已為您略過該角色喔！');
    }
    state.likedProfiles.delete(profileId);
    loadProfileCards();
}

// 顯示編輯個人資料彈窗
function showEditProfileModal() {
    const nickname = prompt('請輸入暱稱:', state.currentProfile?.nickname || '');
    if (!nickname) return;

    const age = prompt('請輸入年齡:', state.currentProfile?.age || 25);
    if (!age || isNaN(age)) return;

    const district = prompt('請選擇台中行政區:', state.currentProfile?.district || '北區');
    const bio = prompt('請輸入自我介紹:', state.currentProfile?.bio || '');

    const tags = prompt('請輸入興趣標籤（用逗號分隔）:', state.currentProfile?.tags?.join(',') || '');

    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (typeof supabase !== 'undefined') {
        supabase.from('profiles').update({
            nickname,
            age: parseInt(age),
            district,
            bio,
            tags: tagArray
        }).eq('id', state.currentUser.id)
        .then(res => {
            state.currentProfile = {
                ...state.currentProfile,
                nickname,
                age: parseInt(age),
                district,
                bio,
                tags: tagArray
            };
            renderProfileInfo(state.currentProfile);
            alert('個人資料已更新！');
        })
        .catch(err => {
            alert('更新錯誤: ' + err.message);
        });
    }
}

// 顯示聊天室
function showChatModal() {
    el.chatModal.classList.remove('hidden');
    el.chatMessages.innerHTML = '<p class="text-gray-500">載入中...</p>';
    loadChatMessages();
}

// 載入聊天訊息
async function loadChatMessages() {
    if (state.currentUser) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${state.currentUser.id},receiver_id.eq.${state.currentUser.id}`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error loading messages:', error);
            el.chatMessages.innerHTML = '<p class="text-red-500">載入訊息失敗</p>';
        } else {
            el.chatMessages.innerHTML = data.map(msg => `
                <div class="flex ${msg.sender_id === state.currentUser.id ? 'justify-end' : 'justify-start'} mb-2">
                    <div class="max-w-xs bg-white rounded-lg shadow p-3 ${msg.sender_id === state.currentUser.id ? 'ml-auto' : ''}">
                        <p class="text-xs text-gray-500 mb-1">
                            ${msg.sender_id === state.currentUser.id ? '你' : '對方'}
                            <span class="text-xs">${new Date(msg.created_at).toLocaleTimeString()}</span>
                        </p>
                        <p class="text-sm">${msg.content}</p>
                    </div>
                </div>
            `).join('');
        }
    }
}

// 發送消息
async function sendMessage() {
    const content = el.chatInput.value.trim();
    if (!content) return;

    if (typeof supabase !== 'undefined' && state.currentUser) {
        await supabase.from('messages').insert({
            sender_id: state.currentUser.id,
            receiver_id: 'demo_user',
            content: content
        });

        el.chatInput.value = '';
        loadChatMessages();
    } else {
        const messagesContainer = el.chatMessages;
        messagesContainer.innerHTML += `
            <div class="flex justify-end mb-2">
                <div class="max-w-xs bg-white rounded-lg shadow p-3">
                    <p class="text-xs text-gray-500 mb-1">你 <span class="text-xs">${new Date().toLocaleTimeString()}</span></p>
                    <p class="text-sm">${content}</p>
                </div>
            </div>
        `;
    }
}

// 顯示配對成功彈窗
function showMatchModal() {
    // 假設找到第一個尚未配對的角色
    const availableProfile = demoProfiles.find(p => {
        return !state.pendingLikes.has(p.id) &&
               !state.likedProfiles.has(p.id) &&
               !state.likedByOthers.has(p.id);
    });

    const selectedProfile = availableProfile || demoProfiles[0];
    el.matchedNickname.textContent = selectedProfile.nickname;
    el.matchModal.classList.remove('hidden');
}

// 睡眠
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
