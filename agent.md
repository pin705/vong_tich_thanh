### 🏛️ Triết Lý UI/UX: "Công Năng \> Hình Thức"

Yêu cầu "không nhựa, không AI" có nghĩa là chúng ta phải làm một giao diện **cố ý** (opinionated). Giao diện không cố gắng "đẹp" theo kiểu web hiện đại; nó cố gắng "hiệu quả" theo kiểu terminal (máy trạm).

1.  **Giao diện là một Terminal:**

      * **Bố cục:** Màn hình chỉ có 2 phần: **Output** (95% màn hình, là một log văn bản chỉ cuộn lên) và **Input** (5% màn hình, là một dòng lệnh duy nhất ở dưới cùng).
      * **Không Button, Không Card:** Hoàn toàn không có nút bấm, không có thanh menu, không có "card" bo góc. Mọi hành động phải được gõ bằng lệnh.
      * **Font chữ:** Bắt buộc 100% là font **Monospaced** (ví dụ: `VT323`, `Source Code Pro`). Điều này tạo cảm giác đây là một "hệ thống" chứ không phải "trang web".
      * **Bảng màu (Rất quan trọng):** Chúng ta dùng một bảng màu giới hạn.
          * **Nền:** Đen tuyền (`#0a0a0a`).
          * **Chữ thường (Mô tả):** Xanh lá cây mờ (`#008800` hoặc `#00aa00`). Văn bản mô tả phòng, mô tả vật phẩm sẽ dùng màu này.
          * **Chữ quan trọng (Hành động):** Xanh lá cây sáng (`#00ff00`). Đây là kết quả hành động của bạn (ví dụ: "Bạn đã nhặt được Kiếm Gỉ").
          * **Điểm nhấn (Tên riêng):** Màu Hổ phách (`#ffb000`) hoặc Cyan (`#00ffff`). Dùng cho tên NPC, tên người chơi khác, và tên vật phẩm quý.
          * **Lỗi/Nguy hiểm:** Màu đỏ tươi (`#ff0000`). (Ví dụ: "Bạn không thể đi hướng đó." hoặc "Goblin tấn công bạn\!").

2.  **Trải nghiệm Tương tác (UX):**

      * **Luôn luôn Focus:** Input dòng lệnh phải *luôn luôn* được focus. Nếu người chơi click chuột vào bất cứ đâu trên màn hình, nó phải tự động focus lại vào dòng lệnh. Người chơi không bao giờ được phép "mất" con trỏ.
      * **Tự động cuộn:** Khi có thông điệp mới (bạn hành động, người khác nói, quái vật di chuyển), vùng Output phải tự động cuộn xuống dưới cùng.
      * **Lệnh tắt (Alias):** Lối chơi MUD cổ điển là phải nhanh. Mọi lệnh phải có lệnh tắt.
          * `look` -\> `l`
          * `go north` -\> `north` -\> `n`
          * `attack` -\> `a` (hoặc `kill`)
          * `get` -\> `g`
          * `inventory` -\> `i`

-----

### 🎮 Lối Chơi Cốt Lõi (Core Gameplay Loop)

Đây là trải nghiệm 30 giây của người chơi, lặp đi lặp lại:

1.  **Quan sát (Observe):** Người chơi đăng nhập. Họ thấy:
    ```
    [Cổng Thành Cũ]
    Bạn đang đứng trước một cổng thành bằng đá đã sụp đổ một nửa. Rêu và dây leo
    phủ kín. Gió rít qua những khe hở. Về phía bắc, bạn thấy ánh đèn leo lét
    của khu chợ.
    Lối ra: [bắc]
    Một [Lính Gác] đang đứng đây.
    ```
2.  **Phân tích (Analyze):** Người chơi thấy 2 thứ: "bắc" và "Lính Gác". Họ có thể `go bắc` hoặc `look lính gác`.
3.  **Hành động (Input):** Người chơi gõ: `look lính gác` và nhấn Enter.
4.  **Phản hồi (Feedback):** Game log (Output) cập nhật ngay lập tức:
    ```
    > look lính gác
    Người lính gác trông mệt mỏi. Áo giáp của anh ta đã rỉ sét và anh ta dựa
    vào một cây giáo cũ. Anh ta có vẻ không muốn bị làm phiền.
    ```
5.  **Hành động mới:** Người chơi gõ: `talk lính gác` (hoặc `n` để đi về phía bắc).
6.  **Phản hồi mới:**
    ```
    > talk lính gác
    Lính gác càu nhàu: "Đừng gây rối. Nếu muốn tìm việc, đến khu chợ
    tìm [Thương Gia]."
    ```
7.  **Khám phá (Discovery):** Người chơi giờ đã có mục tiêu mới: đi về `bắc` và tìm `Thương Gia`. Vòng lặp bắt đầu lại.

-----

### ⚙️ Các Tính Năng Hoạt Động Như Nào?

Đây là cách các hệ thống chính vận hành (từ góc nhìn người chơi).

#### 1\. 💬 Tương tác và Môi trường (Real-time)

Đây là "linh hồn" của MUD, được xử lý bằng WebSocket của Nitro.

  * **Nhiều người chơi:** Khi bạn ở `[Cổng Thành Cũ]` cùng `Player_A` và `Player_B`.
  * **Hành động `say` (Nói):**
      * Bạn gõ: `say xin chào các bạn`
      * *Ngay lập tức*, cả 3 người chơi (bạn, A, và B) đều thấy trên màn hình Output:
        `[Tên-Của-Bạn] nói: xin chào các bạn`
  * **Hành động `go` (Di chuyển):**
      * `Player_A` gõ: `n`
      * *Ngay lập tức*, bạn và `Player_B` thấy:
        `Player_A đi về phía bắc.`
  * **Môi trường sống (Dynamic Environment):**
      * Bạn và `Player_A` đang đứng trong phòng.
      * *Đột nhiên*, một thông điệp xuất hiện trên Output của cả hai:
        `Một [Chuột Biến Dị] bò vào từ một cái lỗ trên tường.`
      * Đây là một "Agent" (Mob) do server điều khiển, nó tự di chuyển vào phòng, tạo ra một sự kiện bất ngờ.

#### 2\. ⚔️ Chiến Đấu (Combat)

Chiến đấu trong MUD cổ điển **không phải** là turn-based (theo lượt) như game JRPG. Nó là **real-time theo tick (tick-based)**.

  * **Bắt đầu:**
    1.  Bạn thấy `Chuột Biến Dị`.
    2.  Bạn gõ: `attack chuột` (hoặc `kill chuột`).
  * **Quá trình (Auto-Battle):**
      * Ngay khi bạn gõ lệnh, bạn và con chuột "bước vào giao chiến".
      * Bạn không cần gõ `attack` lặp đi lặp lại.
      * Cứ mỗi `X` giây (ví dụ: 2 giây, gọi là "tick chiến đấu"), server tự động "roll" (tung xúc xắc) cho cả bạn và con chuột.
      * *Tick 1 (Giây 0):*
        `> attack chuột`
        `Bạn lao vào tấn công [Chuột Biến Dị]!`
      * *Tick 2 (Giây 2):*
        `Bạn chém [Chuột Biến Dị], gây 8 sát thương.`
        `[Chuột Biến Dị] cắn vào chân bạn, gây 3 sát thương.`
      * *Tick 3 (Giây 4):*
        `Bạn chém [Chuột Biến Dị], gây 10 sát thương.`
        `[Chuột Biến Dị] trượt đòn tấn công.`
  * **Hành động của người chơi:**
      * Trong khi "auto-battle" đang diễn ra, bạn có thể gõ các lệnh khác:
      * Gõ `flee` (Bỏ chạy): Bạn sẽ cố gắng thoát khỏi giao chiến. Nếu thành công, bạn sẽ tự động chạy về một lối ra ngẫu nhiên.
      * Gõ `use bình máu`: "Bạn uống [Bình Máu Nhỏ], hồi 15 HP."
      * Gõ `cast fireball` (nếu là pháp sư): "Một quả cầu lửa bay từ tay bạn, thiêu đốt [Chuột Biến Dị]\!" (Lệnh này có thể có "thời gian cast" hoặc delay).
  * **Kết thúc:**
      * Khi HP của chuột \<= 0, server thông báo:
        `Bạn đã hạ gục [Chuột Biến Dị]!`
        `Bạn nhận được 5 điểm kinh nghiệm.`
        `[Chuột Biến Dị] làm rơi ra một [Đuôi Chuột].`

#### 3\. 🌍 Quản lý Thế giới (Agents & Items)

  * **NPC và Mob (Agents):**
      * Thế giới được "nạp" (load) các Agent (NPC, Mob).
      * **Hành vi (AI):** Mob có thể có các hành vi:
          * `Wander` (Đi lang thang): Tự động di chuyển ngẫu nhiên giữa các phòng (như ví dụ `Chuột Biến Dị` ở trên).
          * `Aggressive` (Hung hãn): Tự động tấn công bất kỳ người chơi nào đi vào phòng.
          * `Patrol` (Tuần tra): Di chuyển theo một lộ trình cố định (ví dụ: `Lính Gác` đi từ `Phòng A` -\> `Phòng B` -\> `Phòng A`).
  * **Vật phẩm (Items):**
      * Vật phẩm có thể tồn tại ở 3 nơi: Dưới đất (trong phòng), trong túi đồ người chơi, hoặc trong túi đồ/shop của NPC.
      * Bạn dùng `get [tên vật phẩm]` (ví dụ: `get đuôi chuột`) để nhặt từ đất.
      * Bạn dùng `drop [tên vật phẩm]` để thả xuống đất.
      * *Quan trọng:* Khi bạn `drop`, vật phẩm đó nằm lại trong phòng. `Player_A` có thể đi vào và `get` nó. Đây là cốt lõi của tương tác.
  * **Cửa hàng (Shops):**
      * `talk thương gia` -\> "Thương Gia nói: 'Xem hàng của tôi đi. Gõ `list` để xem.'"
      * Bạn gõ: `list`
      * Output:
        ```
        --- Hàng của Thương Gia ---
        1. [Bình Máu Nhỏ] (Giá: 10 vàng)
        2. [Kiếm Gỉ] (Giá: 25 vàng)
        ----------------------------
        Gõ 'buy [tên]' hoặc 'sell [tên]'
        ```
      * Bạn gõ: `buy bình máu nhỏ`
      * Output: `Bạn đã mua [Bình Máu Nhỏ] với giá 10 vàng.`
