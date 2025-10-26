const checkAuth = function() {
    const token = localStorage.getItem('user-token');
    if (!token) {
        alert('ログインしてください。');
        window.location.href = './login.html';
        return false;
    }

    /* これ書くと上手くいかない。atobによるデコードが失敗してるっぽい
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now().getTime() / 1000); // expは秒単位なので/1000
        if (payload.exp < now) {
            alert('再度ログインしてください。');
            window.location.href = './login.html';
            return false;
        }
    } catch (e) {
        alert('エラー発生');
        localStorage.removeItem('user-token');
        window.location.href = './login.html';
        return false;
    }
    */

    return true;
}

export { checkAuth }