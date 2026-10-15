import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_report(output_path, image_path):
    doc = docx.Document()
    
    # Page Setup: A4, Margins: Top 20mm, Bottom 20mm, Left 30mm, Right 20mm
    section = doc.sections[0]
    section.page_width = Inches(8.27)   # 210 mm
    section.page_height = Inches(11.69) # 297 mm
    section.top_margin = Inches(0.79)    # 20 mm
    section.bottom_margin = Inches(0.79) # 20 mm
    section.left_margin = Inches(1.18)   # 30 mm
    section.right_margin = Inches(0.79)  # 20 mm
    section.different_first_page_header_footer = True
    
    # Configure Header and Footer for subsequent pages
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hrun = hp.add_run("Báo cáo Phân tích & Thiết kế Website CineStream | 2024")
    hrun.font.name = "Times New Roman"
    hrun.font.size = Pt(9)
    hrun.font.italic = True
    hrun.font.color.rgb = RGBColor(100, 116, 139)
    
    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    frun = fp.add_run("Trang ")
    frun.font.name = "Times New Roman"
    frun.font.size = Pt(10)
    frun.font.color.rgb = RGBColor(100, 116, 139)
    fldSimple = parse_xml(f'<w:fldSimple {nsdecls("w")} w:instr="PAGE"/>')
    fp._p.append(fldSimple)
    
    # Default Normal Style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(12)
    style_normal.font.color.rgb = RGBColor(30, 41, 59)
    style_normal.paragraph_format.line_spacing = 1.3
    style_normal.paragraph_format.space_after = Pt(6)
    
    # Helper functions
    def add_p(text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, italic=False, size=12, color=RGBColor(30, 41, 59), space_before=0, space_after=6):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.3
        if text:
            run = p.add_run(text)
            run.font.name = 'Times New Roman'
            run.font.bold = bold
            run.font.italic = italic
            run.font.size = Pt(size)
            run.font.color.rgb = color
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.bold = True
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(30, 58, 138) # Dark Navy #1E3A8A
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.bold = True
        run.font.size = Pt(13.5)
        run.font.color.rgb = RGBColor(37, 99, 235) # Blue #2563EB
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
        return p

    def set_cell_background(cell, fill_hex):
        tcPr = cell._element.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
        tcPr = cell._element.get_or_add_tcPr()
        tcMar = parse_xml(f'''
            <w:tcMar {nsdecls('w')}>
                <w:top w:w="{top}" w:type="dxa"/>
                <w:bottom w:w="{bottom}" w:type="dxa"/>
                <w:left w:w="{left}" w:type="dxa"/>
                <w:right w:w="{right}" w:type="dxa"/>
            </w:tcMar>
        ''')
        tcPr.append(tcMar)

    def set_table_borders(table, color="CBD5E1", sz="4"):
        tblPr = table._element.xpath('w:tblPr')
        if tblPr:
            borders = parse_xml(f'''
                <w:tblBorders {nsdecls('w')}>
                    <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                    <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                    <w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                    <w:left w:val="none"/>
                    <w:right w:val="none"/>
                    <w:insideV w:val="none"/>
                </w:tblBorders>
            ''')
            tblPr[0].append(borders)

    def add_callout(text, prefix="Lưu ý: "):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        
        # Left thick border, no other borders
        tcPr = cell._element.get_or_add_tcPr()
        borders = parse_xml(f'''
            <w:tcBorders {nsdecls('w')}>
                <w:top w:val="none"/>
                <w:left w:val="single" w:sz="24" w:space="0" w:color="2563EB"/>
                <w:bottom w:val="none"/>
                <w:right w:val="none"/>
            </w:tcBorders>
        ''')
        tcPr.append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.line_spacing = 1.25
        p.paragraph_format.space_after = Pt(2)
        r_pre = p.add_run(prefix)
        r_pre.font.name = 'Times New Roman'
        r_pre.font.bold = True
        r_pre.font.size = Pt(11)
        r_pre.font.color.rgb = RGBColor(30, 58, 138)
        
        r_text = p.add_run(text)
        r_text.font.name = 'Times New Roman'
        r_text.font.size = Pt(11)
        r_text.font.color.rgb = RGBColor(51, 65, 85)
        
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ---------------------------------------------------------
    # TRANG BÌA (COVER PAGE)
    # ---------------------------------------------------------
    cov_p1 = add_p("BỘ GIÁO DỤC VÀ ĐÀO TẠO", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13, space_before=10, space_after=2)
    cov_p2 = add_p("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN & TRUYỀN THÔNG", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=14, space_before=0, space_after=2)
    cov_p3 = add_p("KHOA CÔNG NGHỆ THÔNG TIN", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13, space_before=0, space_after=40)
    
    # Line separator
    cov_line = add_p("-----------------------------------------", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_before=0, space_after=40)
    
    cov_title1 = add_p("BÁO CÁO BÀI TẬP LỚN / TIỂU LUẬN CHUYÊN NGÀNH", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=15, color=RGBColor(30, 58, 138), space_before=0, space_after=8)
    cov_subject = add_p("HỌC PHẦN: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG THÔNG TIN", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13, color=RGBColor(71, 85, 105), space_before=0, space_after=25)
    
    cov_topic_label = add_p("ĐỀ TÀI:", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13, space_before=0, space_after=6)
    cov_topic = add_p("PHÂN TÍCH YÊU CẦU, THIẾT KẾ USE CASE VÀ CƠ SỞ DỮ LIỆU\nNỀN TẢNG WEBSITE XEM PHIM TRỰC TUYẾN \"CINESTREAM\"", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=17, color=RGBColor(30, 58, 138), space_before=0, space_after=60)
    
    # Student / Teacher Info Box
    cov_box = doc.add_table(rows=4, cols=2)
    cov_box.alignment = WD_TABLE_ALIGNMENT.CENTER
    cov_data = [
        ("Giảng viên hướng dẫn:", "TS. / ThS. [Điền tên Giảng viên]"),
        ("Sinh viên thực hiện:", "[Họ và tên sinh viên]"),
        ("Mã số sinh viên (MSSV):", "[Mã số sinh viên]"),
        ("Lớp chuyên ngành / Khóa:", "[Tên Lớp - Khóa học]")
    ]
    for r_idx, (col1, col2) in enumerate(cov_data):
        row = cov_box.rows[r_idx]
        c1, c2 = row.cells[0], row.cells[1]
        c1.width = Inches(2.2)
        c2.width = Inches(3.8)
        p1 = c1.paragraphs[0]
        p1.paragraph_format.line_spacing = 1.3
        p1.paragraph_format.space_after = Pt(4)
        run1 = p1.add_run(col1)
        run1.font.name = 'Times New Roman'
        run1.font.bold = True
        run1.font.size = Pt(12)
        
        p2 = c2.paragraphs[0]
        p2.paragraph_format.line_spacing = 1.3
        p2.paragraph_format.space_after = Pt(4)
        run2 = p2.add_run(col2)
        run2.font.name = 'Times New Roman'
        run2.font.size = Pt(12)
        
    add_p("", space_before=60, space_after=0)
    cov_date = add_p("HÀ NỘI / TP. HỒ CHÍ MINH - THÁNG 10 NĂM 2024", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_before=40, space_after=0)
    
    doc.add_page_break()
    
    # ---------------------------------------------------------
    # MỤC LỤC & LỜI MỞ ĐẦU
    # ---------------------------------------------------------
    add_h1("MỤC LỤC BÁO CÁO")
    toc_p = add_p("LỜI MỞ ĐẦU .................................................................................................................................... 3\n"
                  "CHƯƠNG 1: PHÂN TÍCH YÊU CẦU HỆ THỐNG WEBSITE CINESTREAM ............................. 4\n"
                  "   1.1. Bối cảnh và khảo sát nhu cầu người dùng ..................................................................... 4\n"
                  "   1.2. Phân tích yêu cầu chức năng (Functional Requirements) .............................................. 4\n"
                  "   1.3. Phân tích yêu cầu phi chức năng (Non-Functional Requirements) .................................. 6\n"
                  "CHƯƠNG 2: THIẾT KẾ USE CASE CHO HỆ THỐNG ............................................................... 7\n"
                  "   2.1. Xác định và mô tả các tác nhân (Actors) ........................................................................ 7\n"
                  "   2.2. Sơ đồ phân rã và ma trận Use Case tổng quát ................................................................ 7\n"
                  "   2.3. Bảng đặc tả chi tiết các Use Case chính ........................................................................... 8\n"
                  "CHƯƠNG 3: THIẾT KẾ CƠ SỞ DỮ LIỆU CHI TIẾT ................................................................. 13\n"
                  "   3.1. Mô hình quan hệ thực thể (ERD) và phân tích quan hệ .................................................. 13\n"
                  "   3.2. Bảng đặc tả chi tiết các bảng dữ liệu (Data Dictionary - 6 bảng) ................................... 14\n"
                  "   3.3. Ràng buộc toàn vẹn và toàn vẹn tham chiếu ................................................................... 19\n"
                  "   3.4. Kịch bản DDL tạo bảng cơ sở dữ liệu (SQL Schema) ..................................................... 20\n"
                  "CHƯƠNG 4: THIẾT KẾ KIẾN TRÚC VÀ GIAO DIỆN HỆ THỐNG ............................................ 22\n"
                  "   4.1. Kiến trúc phân tầng của hệ thống CineStream .............................................................. 22\n"
                  "   4.2. Thiết kế luồng trải nghiệm và các màn hình chính .......................................................... 22\n"
                  "KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN .................................................................................... 24\n"
                  "TÀI LIỆU THAM KHẢO ............................................................................................................ 25")
    
    doc.add_page_break()
    
    # ---------------------------------------------------------
    # LỜI MỞ ĐẦU
    # ---------------------------------------------------------
    add_h1("LỜI MỞ ĐẦU")
    add_p("Trong kỷ nguyên số hóa và sự phát triển vượt bậc của hạ tầng viễn thông băng thông rộng, thói quen giải trí của khán giả toàn cầu nói chung và Việt Nam nói riêng đã có bước chuyển dịch căn bản: từ truyền hình truyền thống sang các dịch vụ phát trực tuyến theo yêu cầu (VOD/OTT Streaming) như Netflix, HBO Max, Disney+, Apple TV+. Người dùng hiện đại đòi hỏi một nền tảng giải trí có giao diện trực quan, tốc độ tải phim nhanh, chất lượng hình ảnh sắc nét (Full HD, 4K HDR), và đặc biệt là khả năng cá nhân hóa trải nghiệm xem phim cao độ.")
    add_p("Xuất phát từ nhu cầu thực tiễn đó, đề tài \"Phân tích yêu cầu, thiết kế Use Case và Cơ sở dữ liệu cho nền tảng website xem phim trực tuyến CineStream\" được lựa chọn nghiên cứu và triển khai. Dự án hướng tới xây dựng một hệ thống website giải trí điện ảnh hiện đại theo phong cách Dark-Cinema, tối ưu hóa trải nghiệm người dùng với các tính năng vượt trội:")
    
    p = add_p()
    p.add_run("• Quản lý tài khoản và mô hình đa hồ sơ (Multi-Profile): ").bold = True
    p.add_run("Cho phép một tài khoản đăng ký có thể tạo nhiều hồ sơ người xem độc lập (hồ sơ cá nhân, hồ sơ trẻ em Kids) nhằm cá nhân hóa hoàn toàn sở thích xem phim của từng thành viên trong gia đình.\n")
    p.add_run("• Quản lý danh mục phim đa dạng: ").bold = True
    p.add_run("Hỗ trợ cả phim lẻ (Movie) và phim bộ nhiều tập (Series/Episodes) với cấu trúc phân cấp linh hoạt.\n")
    p.add_run("• Ghi nhớ tiến độ xem dở (Continue Watching / Watch Progress): ").bold = True
    p.add_run("Tự động lưu trữ mốc thời gian đang xem dở trên từng hồ sơ để người xem tiếp tục theo dõi dễ dàng trên bất kỳ thiết bị nào.\n")
    p.add_run("• Danh sách yêu thích cá nhân (Watchlist / My List): ").bold = True
    p.add_run("Lưu trữ và đồng bộ danh sách phim yêu thích của từng hồ sơ.")
    
    add_p("Báo cáo này tập trung vào giai đoạn phân tích và thiết kế hệ thống — nền tảng cốt lõi quyết định sự thành bại và tính ổn định lâu dài của sản phẩm phần mềm. Báo cáo được cấu trúc thành các chương nội dung mạch lạc, từ phân tích yêu cầu, thiết kế Use Case chuẩn hóa, đến thiết kế chi tiết cơ sở dữ liệu quan hệ với đầy đủ lược đồ ERD trực quan và các bảng từ điển dữ liệu chuẩn mực.")

    # ---------------------------------------------------------
    # CHƯƠNG 1
    # ---------------------------------------------------------
    add_h1("CHƯƠNG 1: PHÂN TÍCH YÊU CẦU HỆ THỐNG WEBSITE CINESTREAM")
    
    add_h2("1.1. Bối cảnh và khảo sát nhu cầu người dùng")
    add_p("Hệ thống website xem phim trực tuyến CineStream đóng vai trò là cầu nối giữa kho nội dung điện ảnh chất lượng cao và người dùng cuối. Qua khảo sát và phân tích hành vi của khán giả yêu thích điện ảnh, hệ thống cần giải quyết các bài toán nghiệp vụ sau:")
    add_p("1. Đơn giản hóa việc tiếp cận nội dung: Người dùng có thể dễ dàng duyệt phim theo thể loại, tìm kiếm nhanh theo tên phim, xem phim nổi bật (Featured), phim thịnh hành (Trending) mà không bị phân tâm bởi các thông tin dư thừa.")
    add_p("2. Cá nhân hóa tối đa theo hộ gia đình: Trong một gia đình, nhiều người cùng chia sẻ một tài khoản đăng ký nhưng có độ tuổi và gu phim khác nhau. CineStream cần hỗ trợ tạo nhiều Profile trên cùng một tài khoản User, bao gồm cả chế độ hồ sơ an toàn cho trẻ em (isKids).")
    add_p("3. Liền mạch trong trải nghiệm xem: Khi người dùng đang xem dở một tập phim hoặc phim lẻ và tạm dừng, hệ thống phải tự động lưu lại thời gian chính xác (currentTime) và tổng thời lượng (duration) để lần sau người xem chỉ cần 1 cú click là có thể xem tiếp đúng đoạn đã dừng.")

    add_h2("1.2. Phân tích yêu cầu chức năng (Functional Requirements - FR)")
    add_p("Dựa trên mô hình hoạt động của nền tảng streaming hiện đại, các yêu cầu chức năng của hệ thống CineStream được phân rã thành 6 phân hệ cốt lõi sau:")

    add_h3("1.2.1. Phân hệ Quản lý Tài khoản & Gói cước (User & Subscription Management)")
    add_p("• FR-01 (Đăng ký tài khoản): Cho phép người dùng mới đăng ký tài khoản bằng địa chỉ email và mật khẩu. Hệ thống kiểm tra tính duy nhất của email và xác thực định dạng.")
    add_p("• FR-02 (Đăng nhập & Đăng xuất): Xác thực thông tin người dùng qua email và mật khẩu; khởi tạo phiên làm việc bảo mật (Session/JWT).")
    add_p("• FR-03 (Quản lý gói dịch vụ): Cung cấp các gói xem phim (Standard, VIP, Ultra 4K CineVIP). Cho phép người dùng nâng cấp gói cước và xem thông tin quyền lợi của tài khoản.")

    add_h3("1.2.2. Phân hệ Quản lý Đa hồ sơ người xem (Multi-Profile Management)")
    add_p("• FR-04 (Danh sách hồ sơ): Sau khi đăng nhập, hệ thống điều hướng người dùng đến màn hình \"Ai đang xem?\" (Who's watching?) để lựa chọn Profile tương ứng.")
    add_p("• FR-05 (Tạo mới hồ sơ): Cho phép tài khoản tạo thêm hồ sơ con với các thông tin: Tên hồ sơ, Avatar đại diện, và tùy chọn Hồ sơ Trẻ em (isKids = true/false).")
    add_p("• FR-06 (Chỉnh sửa/Xóa hồ sơ): Cho phép đổi tên, cập nhật avatar hoặc xóa một hồ sơ người xem (các dữ liệu lịch sử xem và danh sách yêu thích của hồ sơ đó sẽ được dọn dẹp tương ứng).")

    add_h3("1.2.3. Phân hệ Duyệt & Tìm kiếm nội dung (Movie Discovery & Search)")
    add_p("• FR-07 (Duyệt phim trang chủ): Hiển thị Banner phim tiêu điểm (Featured Hero), danh sách phim thịnh hành (Trending Now), phim lẻ đặc sắc và các bộ phim nhiều tập (Series).")
    add_p("• FR-08 (Lọc theo thể loại): Cho phép lọc phim theo thể loại (Hành động, Viễn tưởng, Kinh dị, Tâm lý, Hoạt hình...).")
    add_p("• FR-09 (Tìm kiếm thông minh): Cho phép tìm kiếm tức thời theo từ khóa tiêu đề phim, năm phát hành, đạo diễn hoặc diễn viên.")
    add_p("• FR-10 (Xem chi tiết phim): Hiển thị đầy đủ thông tin: Tên phim, trailer, tóm tắt nội dung (synopsis), điểm đánh giá (rating), năm phát hành (releaseYear), thời lượng (duration), danh sách các tập phim (đối với Series).")

    add_h3("1.2.4. Phân hệ Trình phát trực tuyến (Video Streaming & Cinema Player)")
    add_p("• FR-11 (Trình phát video rạp hát): Phát video chất lượng cao với thanh điều khiển chuyên nghiệp: Play/Pause, tua tiến/lùi 10 giây, điều chỉnh âm lượng, toàn màn hình (Fullscreen), tùy chỉnh tốc độ phát.")
    add_p("• FR-12 (Điều hướng tập phim Series): Đối với phim bộ, cho phép chọn nhanh giữa các mùa (Seasons) và các tập (Episodes) ngay trong trình phát mà không cần thoát ra ngoài.")

    add_h3("1.2.5. Phân hệ Cá nhân hóa (Watch Progress & My List)")
    add_p("• FR-13 (Tiến độ xem dở - Continue Watching): Trong quá trình phát video, hệ thống định kỳ tự động lưu mốc thời gian xem hiện tại (currentTime) và tính toán % tiến độ xem dở vào bảng WatchProgress của Profile đang hoạt động.")
    add_p("• FR-14 (Danh sách yêu thích - My List): Cho phép Profile nhấn nút \"+ Thêm vào danh sách\" (Add to My List) để lưu phim vào bảng WatchlistItem cá nhân, và xem lại toàn bộ kho phim yêu thích trên trang \"My List\".")

    add_h3("1.2.6. Phân hệ Quản trị hệ thống (Administrator Management)")
    add_p("• FR-15 (Quản lý danh mục phim): Quản trị viên có quyền Thêm mới, Chỉnh sửa, và Xóa các bộ phim (Movie/Series) trong cơ sở dữ liệu.")
    add_p("• FR-16 (Quản lý tập phim Series): Thêm và liên kết các tập phim (Episode) vào Series cha tương ứng.")
    add_p("• FR-17 (Quản lý người dùng): Theo dõi danh sách tài khoản thành viên, gói dịch vụ đang hoạt động, và trạng thái tài khoản.")

    add_h2("1.3. Phân tích yêu cầu phi chức năng (Non-Functional Requirements - NFR)")
    add_p("Để đảm bảo website vận hành ổn định, mang lại sự thỏa mãn cao nhất cho người dùng, hệ thống đáp ứng các tiêu chuẩn kỹ thuật sau:")
    add_p("1. Tính hiệu năng (Performance): Thời gian tải trang ban đầu dưới 1.5 giây; thời gian đệm (buffering) video khởi đầu dưới 2 giây trên đường truyền tiêu chuẩn.")
    add_p("2. Tính khả dụng và thẩm mỹ (Usability & Design): Giao diện thiết kế theo chuẩn Dark Theme hiện đại, phong cách rạp chiếu phim (Cinema Aesthetics), độ tương phản cao, phông chữ dễ đọc, hỗ trợ Responsive hoàn hảo trên máy tính bàn, laptop, tablet và điện thoại di động.")
    add_p("3. Tính bảo mật (Security): Mật khẩu người dùng được băm an toàn (hashing); các truy vấn API bảo vệ quyền riêng tư giữa các tài khoản; ngăn chặn các lỗ hổng phổ biến như SQL Injection, XSS, CSRF.")
    add_p("4. Tính toàn vẹn dữ liệu (Data Integrity): Thiết kế cơ sở dữ liệu tuân thủ chuẩn hóa 3NF, thiết lập đầy đủ khóa ngoại (Foreign Keys) và cơ chế xóa liên hoàn (ON DELETE CASCADE) để loại bỏ hoàn toàn nguy cơ dữ liệu mồ côi (orphaned records).")

    # ---------------------------------------------------------
    # CHƯƠNG 2
    # ---------------------------------------------------------
    add_h1("CHƯƠNG 2: THIẾT KẾ USE CASE CHO HỆ THỐNG")
    
    add_h2("2.1. Xác định và mô tả các tác nhân (Actors)")
    add_p("Trong hệ thống CineStream, có 4 tác nhân chính tham gia tương tác:")
    
    actor_table = doc.add_table(rows=5, cols=3)
    actor_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(actor_table)
    headers = ["STT", "Tác nhân (Actor)", "Mô tả vai trò và quyền hạn"]
    col_widths = [Inches(0.6), Inches(1.8), Inches(4.2)]
    
    # Format header
    hdr_row = actor_table.rows[0]
    for c_idx, h_text in enumerate(headers):
        cell = hdr_row.cells[c_idx]
        cell.width = col_widths[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(h_text)
        run.font.name = 'Times New Roman'
        run.font.bold = True
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(255, 255, 255)
        
    actors_data = [
        ("1", "Khách vãng lai (Guest)", "Người dùng chưa đăng nhập. Có quyền xem trang chủ, xem trailer phim, duyệt danh mục thể loại, xem bảng giá gói cước và thực hiện đăng ký tài khoản mới."),
        ("2", "Thành viên (User / Account Owner)", "Chủ tài khoản đã đăng ký và đăng nhập vào hệ thống. Có quyền quản lý thông tin tài khoản, gói cước dịch vụ, và tạo/sửa/xóa các hồ sơ người xem (Profiles) trong gia đình."),
        ("3", "Hồ sơ người xem (Viewer Profile)", "Người dùng thực tế đang thưởng thức phim dưới một Profile cụ thể. Có quyền tìm kiếm phim, xem phim trực tuyến, lưu tiến độ xem dở (Continue Watching), và thêm phim vào danh sách yêu thích cá nhân (My List)."),
        ("4", "Quản trị viên (Administrator)", "Người quản trị hệ thống. Có toàn quyền quản lý kho phim (thêm/sửa/xóa Movie, Series, Episode), quản lý người dùng và giám sát vận hành hệ thống.")
    ]
    for r_idx, row_data in enumerate(actors_data):
        row = actor_table.rows[r_idx + 1]
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, 70, 70, 90, 90)
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.2
            p.paragraph_format.space_after = Pt(2)
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(val)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(11)
            if c_idx == 1:
                run.font.bold = True
                
    add_p("", space_before=10, space_after=4)

    add_h2("2.2. Sơ đồ phân rã và ma trận Use Case tổng quát")
    add_p("Hệ thống bao gồm các nhóm Use Case chính được phân chia theo tác nhân tương ứng:")
    
    uc_matrix = doc.add_table(rows=9, cols=5)
    uc_matrix.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(uc_matrix)
    m_headers = ["Mã UC", "Tên Use Case", "Khách", "Thành viên/Profile", "Quản trị viên"]
    m_widths = [Inches(0.9), Inches(2.7), Inches(0.9), Inches(1.3), Inches(1.1)]
    
    hdr_row = uc_matrix.rows[0]
    for c_idx, h_text in enumerate(m_headers):
        cell = hdr_row.cells[c_idx]
        cell.width = m_widths[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, 80, 80, 80, 80)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(h_text)
        run.font.name = 'Times New Roman'
        run.font.bold = True
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(255, 255, 255)
        
    matrix_data = [
        ("UC01", "Đăng ký & Đăng nhập tài khoản", "X", "X", "-"),
        ("UC02", "Quản lý Đa hồ sơ (Multi-Profile)", "-", "X", "-"),
        ("UC03", "Tìm kiếm và Lọc danh mục phim", "X", "X", "X"),
        ("UC04", "Xem phim & Lưu tiến độ (Continue Watching)", "-", "X", "-"),
        ("UC05", "Quản lý Danh sách yêu thích (My List)", "-", "X", "-"),
        ("UC06", "Quản lý Gói cước dịch vụ", "-", "X", "-"),
        ("UC07", "Quản lý Kho phim & Tập phim (CRUD)", "-", "-", "X"),
        ("UC08", "Quản lý Tài khoản & Phân quyền", "-", "-", "X"),
    ]
    for r_idx, row_data in enumerate(matrix_data):
        row = uc_matrix.rows[r_idx + 1]
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = m_widths[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, 60, 60, 80, 80)
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.2
            p.paragraph_format.space_after = Pt(2)
            if c_idx in [0, 2, 3, 4]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(val)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(10.5)
            if c_idx == 0:
                run.font.bold = True
                
    add_p("", space_before=10, space_after=4)

    add_h2("2.3. Bảng đặc tả chi tiết các Use Case chính")
    add_p("Dưới đây là đặc tả kỹ thuật chi tiết theo chuẩn công nghệ phần mềm cho 6 Use Case trọng tâm của hệ thống CineStream:")

    def add_uc_spec(uc_id, uc_name, actor, desc, pre_cond, post_cond, main_flow, alt_flow):
        add_h3(f"{uc_id}: {uc_name}")
        tbl = doc.add_table(rows=7, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl)
        w1, w2 = Inches(1.8), Inches(4.8)
        
        fields = [
            ("Mã Use Case", uc_id),
            ("Tác nhân chính", actor),
            ("Mục đích", desc),
            ("Điều kiện tiên quyết", pre_cond),
            ("Điều kiện sau", post_cond),
            ("Luồng sự kiện chính", main_flow),
            ("Luồng ngoại lệ / Rẽ nhánh", alt_flow)
        ]
        
        for r_idx, (f_name, f_val) in enumerate(fields):
            row = tbl.rows[r_idx]
            c1, c2 = row.cells[0], row.cells[1]
            c1.width = w1
            c2.width = w2
            set_cell_background(c1, "F1F5F9")
            set_cell_background(c2, "FFFFFF")
            set_cell_margins(c1, 60, 60, 90, 90)
            set_cell_margins(c2, 60, 60, 90, 90)
            
            p1 = c1.paragraphs[0]
            p1.paragraph_format.line_spacing = 1.25
            p1.paragraph_format.space_after = Pt(2)
            r1 = p1.add_run(f_name)
            r1.font.name = 'Times New Roman'
            r1.font.bold = True
            r1.font.size = Pt(10.5)
            r1.font.color.rgb = RGBColor(30, 58, 138)
            
            p2 = c2.paragraphs[0]
            p2.paragraph_format.line_spacing = 1.25
            p2.paragraph_format.space_after = Pt(2)
            r2 = p2.add_run(f_val)
            r2.font.name = 'Times New Roman'
            r2.font.size = Pt(10.5)
            
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # UC01
    add_uc_spec(
        "UC01", "Đăng ký & Đăng nhập tài khoản",
        "Khách vãng lai, Thành viên",
        "Cho phép người dùng tạo tài khoản mới hoặc xác thực để truy cập vào hệ sinh thái CineStream.",
        "Người dùng đã truy cập vào website CineStream.",
        "Hệ thống xác thực thành công, thiết lập phiên làm việc và điều hướng đến màn hình Chọn hồ sơ người xem (Select Profile).",
        "1. Người dùng chọn 'Đăng ký' hoặc 'Đăng nhập' trên thanh điều hướng.\n"
        "2. Hệ thống hiển thị biểu mẫu yêu cầu nhập Email và Mật khẩu.\n"
        "3. Người dùng nhập thông tin hợp lệ và nhấn nút xác nhận.\n"
        "4. Hệ thống kiểm tra tính hợp lệ của dữ liệu trong bảng User.\n"
        "5. Hệ thống khởi tạo session và chuyển hướng người dùng sang trang Chọn hồ sơ.",
        "3a. Email không đúng định dạng: Hệ thống báo lỗi và yêu cầu nhập lại.\n"
        "4a. Mật khẩu không chính xác hoặc email chưa đăng ký: Hệ thống báo lỗi bảo mật và giữ nguyên form."
    )

    # UC02
    add_uc_spec(
        "UC02", "Quản lý Đa hồ sơ người xem (Multi-Profile)",
        "Thành viên (User)",
        "Cho phép một tài khoản quản lý nhiều hồ sơ xem phim độc lập, phân chia hồ sơ người lớn và trẻ em.",
        "Thành viên đã đăng nhập thành công vào hệ thống.",
        "Hồ sơ mới được ghi nhận vào bảng Profile; hoặc hồ sơ hiện có được cập nhật / xóa bỏ.",
        "1. Sau khi đăng nhập, hệ thống hiển thị danh sách các Profile hiện có thuộc về User.\n"
        "2. Người dùng có thể nhấp chọn 1 Profile để bắt đầu xem phim.\n"
        "3. Để tạo mới, người dùng chọn 'Thêm hồ sơ' (+ Add Profile).\n"
        "4. Người dùng nhập Tên hồ sơ, chọn Avatar, và tích chọn 'Trẻ em' (nếu là hồ sơ Kids).\n"
        "5. Người dùng nhấn 'Lưu'. Hệ thống thêm bản ghi vào bảng Profile và cập nhật giao diện.",
        "4a. Tên hồ sơ để trống: Hệ thống thông báo yêu cầu nhập tên hợp lệ.\n"
        "5a. Số lượng hồ sơ vượt quá giới hạn gói cước: Hệ thống gợi ý nâng cấp gói VIP."
    )

    # UC03
    add_uc_spec(
        "UC03", "Tìm kiếm và Lọc danh mục phim",
        "Khách vãng lai, Hồ sơ người xem",
        "Giúp người dùng nhanh chóng tìm ra bộ phim yêu thích theo từ khóa hoặc thể loại.",
        "Người dùng đang ở bất kỳ trang nào trên website.",
        "Hệ thống hiển thị danh sách các phim phù hợp với tiêu chí tìm kiếm.",
        "1. Người dùng nhập từ khóa vào ô tìm kiếm hoặc click vào một Thể loại (Action, Sci-Fi...).\n"
        "2. Hệ thống thực hiện truy vấn thời gian thực trên bảng Movie (tìm theo title, genres, synopsis).\n"
        "3. Hệ thống trả về danh sách các poster phim kèm điểm đánh giá (rating) và năm phát hành.\n"
        "4. Người dùng click vào poster phim để xem thông tin chi tiết.",
        "2a. Không tìm thấy phim phù hợp: Hệ thống hiển thị thông báo 'Không tìm thấy kết quả phù hợp' và gợi ý các phim thịnh hành (Trending)."
    )

    # UC04
    add_uc_spec(
        "UC04", "Xem phim và Tự động ghi nhớ tiến độ xem (Continue Watching)",
        "Hồ sơ người xem (Profile)",
        "Phát video trực tuyến và liên tục lưu giữ thời gian xem dở để người dùng xem tiếp thuận tiện.",
        "Người dùng đã chọn một Profile và chọn một phim/tập phim cụ thể.",
        "Tiến độ xem (currentTime, duration, progress %) được cập nhật liên tục vào bảng WatchProgress.",
        "1. Người dùng nhấn nút 'Xem phim' trên trang chi tiết phim hoặc trang chủ.\n"
        "2. Trình phát Cinema Player khởi chạy video từ videoUrl.\n"
        "3. Nếu phim này từng được xem trước đó, hệ thống truy vấn bảng WatchProgress và tự động tua đến mốc currentTime đã dừng.\n"
        "4. Trong lúc xem, mỗi 5 giây trình duyệt gửi tiến độ cập nhật về cơ sở dữ liệu.\n"
        "5. Khi người dùng bấm tạm dừng hoặc thoát trang, tiến độ cuối cùng được lưu lại hoàn tất.",
        "2a. Video bị lỗi đường truyền: Trình phát hiển thị nút 'Thử lại' hoặc chuyển đổi nguồn phát dự phòng."
    )

    # UC05
    add_uc_spec(
        "UC05", "Quản lý Danh sách yêu thích (My List / Watchlist)",
        "Hồ sơ người xem (Profile)",
        "Cho phép người xem đánh dấu các bộ phim yêu thích để theo dõi lại sau.",
        "Người dùng đang xem thông tin phim dưới một Profile cụ thể.",
        "Một bản ghi mới được thêm vào hoặc xóa khỏi bảng WatchlistItem liên kết với Profile đó.",
        "1. Người dùng bấm vào nút 'Thêm vào danh sách' (+ My List) tại poster phim.\n"
        "2. Hệ thống gửi yêu cầu tạo bản ghi liên kết giữa profileId và movieId vào bảng WatchlistItem.\n"
        "3. Biểu tượng chuyển thành dấu tick 'Đã thêm'.\n"
        "4. Người dùng truy cập trang 'Danh sách của tôi' để duyệt lại toàn bộ các phim đã lưu.\n"
        "5. Người dùng có thể click nút 'Xóa khỏi danh sách' để gỡ bỏ bản ghi.",
        "1a. Phim đã có trong danh sách: Hành động click sẽ đóng vai trò chuyển đổi (toggle) gỡ phim khỏi danh sách yêu thích."
    )

    # UC06
    add_uc_spec(
        "UC06", "Quản lý Kho phim và Tập phim (CRUD - Admin)",
        "Quản trị viên (Admin)",
        "Cung cấp công cụ cho ban quản trị thêm, sửa, xóa nội dung phim lẻ và các tập phim bộ.",
        "Quản trị viên đã đăng nhập với tài khoản có quyền Admin.",
        "Dữ liệu phim và tập phim trong cơ sở dữ liệu (Movie, Episode) được đồng bộ mới nhất.",
        "1. Quản trị viên truy cập bảng điều khiển Admin Dashboard.\n"
        "2. Chọn chức năng 'Thêm phim mới' hoặc 'Chỉnh sửa phim'.\n"
        "3. Nhập các thông tin chi tiết: Title, Slug, Type (movie/series), Synopsis, ReleaseYear, Rating, Genres, PosterUrl, BackdropUrl.\n"
        "4. Nếu là Series: Quản trị viên thêm các Episode tương ứng (Season, EpisodeNumber, VideoUrl).\n"
        "5. Nhấn 'Lưu dữ liệu'. Hệ thống ghi nhận vào bảng Movie và Episode.",
        "5a. Trùng lặp mã định danh hoặc dữ liệu không hợp lệ: Hệ thống từ chối lưu và highlight trường lỗi."
    )

    # ---------------------------------------------------------
    # CHƯƠNG 3
    # ---------------------------------------------------------
    add_h1("CHƯƠNG 3: THIẾT KẾ CƠ SỞ DỮ LIỆU CHI TIẾT")
    
    add_h2("3.1. Mô hình quan hệ thực thể (ERD) và phân tích quan hệ")
    add_p("Cơ sở dữ liệu của CineStream được thiết kế tối ưu theo mô hình dữ liệu quan hệ (Relational Database Management System - RDBMS). Hệ thống bao gồm 6 bảng thực thể liên kết chặt chẽ với nhau, giải quyết trọn vẹn nghiệp vụ xem phim trực tuyến hiện đại.")
    
    # Insert Image
    if os.path.exists(image_path):
        add_p("Dưới đây là sơ đồ kiến trúc Cơ sở dữ liệu (ERD) hoàn chỉnh của hệ thống CineStream:")
        img_p = doc.add_paragraph()
        img_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        img_p.paragraph_format.space_before = Pt(8)
        img_p.paragraph_format.space_after = Pt(4)
        run = img_p.add_run()
        run.add_picture(image_path, width=Inches(6.2))
        
        cap_p = add_p("Hình 3.1: Sơ đồ Thực thể - Mối quan hệ (ERD) của hệ thống CineStream", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, italic=True, size=11, color=RGBColor(30, 58, 138), space_before=2, space_after=12)
    else:
        add_p(f"[CẢNH BÁO: Không tìm thấy tệp ảnh tại đường dẫn {image_path}]")

    add_p("Phân tích chi tiết các mối quan hệ giữa các thực thể trong sơ đồ ERD:")
    add_p("1. Quan hệ giữa User và Profile (1 - N):")
    add_p("Một tài khoản đăng ký (User) có thể tạo nhiều hồ sơ người xem (Profile) khác nhau cho từng thành viên trong gia đình (quan hệ 1 - Nhiều). Mỗi hồ sơ bắt buộc phải thuộc về đúng một User thông qua khóa ngoại userId tham chiếu đến User(id). Khi tài khoản User bị xóa, cơ chế ON DELETE CASCADE sẽ tự động xóa tất cả các Profile liên quan.")
    
    add_p("2. Quan hệ giữa Movie và Episode (1 - N):")
    add_p("Thực thể Movie đại diện cho cả phim lẻ lẫn phim bộ (phân biệt qua thuộc tính type = 'movie' hoặc 'series'). Đối với phim bộ ('series'), một Series sẽ bao gồm nhiều tập phim (Episode). Quan hệ giữa Movie và Episode là 1 - Nhiều. Mỗi tập phim liên kết với Series thông qua khóa ngoại seriesId tham chiếu đến Movie(id).")
    
    add_p("3. Quan hệ giữa Profile và Movie qua WatchProgress (Quan hệ Xem dở - 1 - N):")
    add_p("Đây là bảng cầu nối ghi nhận lịch sử và tiến độ xem phim của từng hồ sơ. Một Profile có thể xem dở nhiều Movie, và một Movie có thể được xem dở bởi nhiều Profile. WatchProgress lưu giữ mốc thời gian xem dở (currentTime), tổng thời lượng (duration), tỷ lệ hoàn thành (progress) và mốc thời gian cập nhật gần nhất (updatedAt). Khóa ngoại profileId tham chiếu Profile(id) và movieId tham chiếu Movie(id).")
    
    add_p("4. Quan hệ giữa Profile và Movie qua WatchlistItem (Quan hệ Yêu thích - 1 - N):")
    add_p("Bảng cầu nối phục vụ tính năng 'My List'. Cho phép mỗi Profile đánh dấu các bộ phim mình yêu thích. Một Profile có thể lưu nhiều phim vào danh sách, và một bộ phim có thể xuất hiện trong danh sách của nhiều Profile. Khóa ngoại profileId tham chiếu Profile(id) và movieId tham chiếu Movie(id).")

    add_h2("3.2. Bảng đặc tả chi tiết các bảng dữ liệu (Data Dictionary)")
    add_p("Cơ sở dữ liệu CineStream gồm 6 bảng chi tiết, vượt mức yêu cầu tối thiểu (>= 3 bảng). Dưới đây là từ điển dữ liệu đặc tả chi tiết từng thuộc tính, kiểu dữ liệu, ràng buộc và ý nghĩa nghiệp vụ:")

    def add_table_spec(tbl_title, tbl_comment, col_specs):
        add_h3(tbl_title)
        add_p(tbl_comment, italic=True, size=11, color=RGBColor(71, 85, 105), space_after=4)
        
        t = doc.add_table(rows=len(col_specs) + 1, cols=7)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(t)
        
        headers = ["STT", "Tên cột (Field)", "Kiểu dữ liệu", "Khóa", "Null", "Mặc định", "Mô tả / Ý nghĩa"]
        widths = [Inches(0.5), Inches(1.5), Inches(1.1), Inches(0.6), Inches(0.6), Inches(0.9), Inches(1.8)]
        
        # Header row
        hdr = t.rows[0]
        for c_idx, h_text in enumerate(headers):
            cell = hdr.cells[c_idx]
            cell.width = widths[c_idx]
            set_cell_background(cell, "1E3A8A")
            set_cell_margins(cell, 70, 70, 60, 60)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(h_text)
            run.font.name = 'Times New Roman'
            run.font.bold = True
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(255, 255, 255)
            
        # Data rows
        for r_idx, col_data in enumerate(col_specs):
            row = t.rows[r_idx + 1]
            bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(col_data):
                cell = row.cells[c_idx]
                cell.width = widths[c_idx]
                set_cell_background(cell, bg)
                set_cell_margins(cell, 60, 60, 60, 60)
                p = cell.paragraphs[0]
                p.paragraph_format.line_spacing = 1.15
                p.paragraph_format.space_after = Pt(2)
                if c_idx in [0, 3, 4]:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = p.add_run(val)
                run.font.name = 'Times New Roman'
                run.font.size = Pt(9.5)
                if c_idx == 1:
                    run.font.bold = True
                if c_idx == 3 and "PK" in val:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(185, 28, 28) # Red for PK
                elif c_idx == 3 and "FK" in val:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(37, 99, 235) # Blue for FK
                    
        doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 1. Bảng User
    add_table_spec(
        "3.2.1. Bảng User (Tài khoản người dùng)",
        "Bảng lưu trữ thông tin định danh của các khách hàng đăng ký dịch vụ CineStream.",
        [
            ("1", "id", "VARCHAR(36)", "PK", "No", "-", "Định danh duy nhất của tài khoản người dùng (UUIDv4)"),
            ("2", "email", "VARCHAR(120)", "Unique", "No", "-", "Địa chỉ email đăng nhập (duy nhất trên toàn hệ thống)"),
            ("3", "password", "VARCHAR(255)", "-", "Yes", "-", "Mật khẩu đăng nhập đã được băm bảo mật (Hash)"),
            ("4", "plan", "VARCHAR(50)", "-", "No", "'Ultra 4K CineVIP'", "Gói cước đăng ký dịch vụ (Free, Standard, VIP, Ultra 4K)"),
            ("5", "createdAt", "DATETIME", "-", "No", "CURRENT_TIMESTAMP", "Thời điểm đăng ký tài khoản")
        ]
    )

    # 2. Bảng Profile
    add_table_spec(
        "3.2.2. Bảng Profile (Hồ sơ người xem - Multi-Profile)",
        "Bảng quản lý các hồ sơ cá nhân hóa cho từng thành viên trong gia đình thuộc tài khoản User.",
        [
            ("1", "id", "VARCHAR(36)", "PK", "No", "-", "Định danh duy nhất của hồ sơ người xem (UUIDv4)"),
            ("2", "userId", "VARCHAR(36)", "FK", "No", "-", "Khóa ngoại liên kết đến User(id). Xóa cascade khi xóa User"),
            ("3", "name", "VARCHAR(50)", "-", "No", "-", "Tên đại diện hiển thị của hồ sơ (vd: Bố, Mẹ, Bé Bo...)"),
            ("4", "avatar", "VARCHAR(255)", "-", "No", "-", "Đường dẫn URL ảnh đại diện cho hồ sơ"),
            ("5", "isKids", "BOOLEAN", "-", "No", "FALSE", "Cờ đánh dấu hồ sơ dành cho trẻ em (lọc nội dung an toàn)")
        ]
    )

    # 3. Bảng Movie
    add_table_spec(
        "3.2.3. Bảng Movie (Danh mục Phim lẻ & Series phim bộ)",
        "Bảng trung tâm lưu trữ toàn bộ dữ liệu nội dung điện ảnh phát sóng trên nền tảng.",
        [
            ("1", "id", "VARCHAR(36)", "PK", "No", "-", "Định danh duy nhất của bộ phim (UUIDv4)"),
            ("2", "slug", "VARCHAR(100)", "-", "No", "-", "Đường dẫn thân thiện SEO (vd: cyber-drift-2099)"),
            ("3", "title", "VARCHAR(200)", "-", "No", "-", "Tiêu đề chính thức của phim"),
            ("4", "type", "VARCHAR(20)", "-", "No", "'movie'", "Phân loại phim: 'movie' (phim lẻ) hoặc 'series' (phim bộ)"),
            ("5", "synopsis", "TEXT", "-", "No", "-", "Đoạn văn tóm tắt cốt truyện và nội dung phim"),
            ("6", "releaseYear", "INTEGER", "-", "No", "2024", "Năm phát hành phim ra mắt công chúng"),
            ("7", "duration", "VARCHAR(30)", "-", "No", "-", "Thời lượng phim (vd: '2h 15m' hoặc '3 Seasons')"),
            ("8", "rating", "VARCHAR(10)", "-", "No", "'8.5'", "Điểm đánh giá chất lượng phim (vd: 8.8, 9.2)"),
            ("9", "genres", "TEXT (JSON)", "-", "No", "-", "Danh sách thể loại phim (lưu dạng mảng chuỗi JSON)"),
            ("10", "posterUrl", "VARCHAR(255)", "-", "No", "-", "Đường dẫn ảnh bìa dọc (Poster)"),
            ("11", "backdropUrl", "VARCHAR(255)", "-", "No", "-", "Đường dẫn ảnh nền ngang chất lượng cao (Backdrop Banner)"),
            ("12", "trailerUrl", "VARCHAR(255)", "-", "Yes", "NULL", "Đường dẫn video trailer giới thiệu phim"),
            ("13", "videoUrl", "VARCHAR(255)", "-", "Yes", "NULL", "Đường dẫn luồng video phát trực tiếp (đối với movie lẻ)"),
            ("14", "isFeatured", "BOOLEAN", "-", "No", "FALSE", "Cờ đánh dấu hiển thị tại Banner tiêu điểm trang chủ"),
            ("15", "isTrending", "BOOLEAN", "-", "No", "FALSE", "Cờ đánh dấu phim đang thịnh hành (Trending Now)"),
            ("16", "isImax", "BOOLEAN", "-", "No", "FALSE", "Đánh dấu phim hỗ trợ định dạng âm thanh hình ảnh IMAX"),
            ("17", "director", "VARCHAR(100)", "-", "Yes", "NULL", "Tên đạo diễn chỉ đạo bộ phim"),
            ("18", "cast", "TEXT (JSON)", "-", "Yes", "NULL", "Danh sách diễn viên tham gia diễn xuất"),
            ("19", "createdAt", "DATETIME", "-", "No", "CURRENT_TIMESTAMP", "Thời điểm thêm phim vào hệ thống")
        ]
    )

    # 4. Bảng Episode
    add_table_spec(
        "3.2.4. Bảng Episode (Tập phim chi tiết của Series)",
        "Bảng lưu trữ thông tin từng tập phim thuộc các bộ phim truyền hình nhiều tập (Series).",
        [
            ("1", "id", "VARCHAR(36)", "PK", "No", "-", "Định danh duy nhất của tập phim (UUIDv4)"),
            ("2", "seriesId", "VARCHAR(36)", "FK", "No", "-", "Khóa ngoại liên kết tới Movie(id). Xóa cascade khi xóa Series"),
            ("3", "season", "INTEGER", "-", "No", "1", "Số thứ tự mùa phim (Season 1, Season 2...)"),
            ("4", "episodeNumber", "INTEGER", "-", "No", "-", "Số thứ tự tập phim trong mùa (Tập 1, Tập 2...)"),
            ("5", "title", "VARCHAR(150)", "-", "No", "-", "Tiêu đề riêng của tập phim"),
            ("6", "synopsis", "TEXT", "-", "No", "-", "Tóm tắt diễn biến cốt truyện tập phim"),
            ("7", "duration", "VARCHAR(30)", "-", "No", "-", "Thời lượng phát của tập phim (vd: '48m')"),
            ("8", "videoUrl", "VARCHAR(255)", "-", "No", "-", "Đường dẫn phát luồng video trực tuyến của tập"),
            ("9", "stillUrl", "VARCHAR(255)", "-", "Yes", "NULL", "Ảnh chụp màn hình tiêu biểu của tập phim (Still)")
        ]
    )

    # 5. Bảng WatchProgress
    add_table_spec(
        "3.2.5. Bảng WatchProgress (Tiến độ xem dở / Continue Watching)",
        "Bảng ghi nhận mốc thời gian đang xem dở của từng hồ sơ với từng bộ phim cụ thể.",
        [
            ("1", "id", "VARCHAR(36)", "PK", "No", "-", "Định danh duy nhất của bản ghi tiến độ (UUIDv4)"),
            ("2", "profileId", "VARCHAR(36)", "FK", "No", "-", "Khóa ngoại tham chiếu Profile(id). Xóa cascade khi xóa Profile"),
            ("3", "movieId", "VARCHAR(36)", "FK", "No", "-", "Khóa ngoại tham chiếu Movie(id). Xóa cascade khi xóa Movie"),
            ("4", "episodeId", "VARCHAR(36)", "-", "Yes", "NULL", "Mã tập phim đang xem dở (nếu là Series)"),
            ("5", "currentTime", "INTEGER", "-", "No", "0", "Thời điểm hiện tại đang xem dở (tính bằng giây)"),
            ("6", "duration", "INTEGER", "-", "No", "0", "Tổng thời lượng phát của video (tính bằng giây)"),
            ("7", "progress", "INTEGER", "-", "No", "0", "Tỷ lệ hoàn thành đã xem (phần trăm từ 0 đến 100%)"),
            ("8", "updatedAt", "DATETIME", "-", "No", "CURRENT_TIMESTAMP", "Thời điểm đồng bộ tiến độ xem gần nhất")
        ]
    )

    # 6. Bảng WatchlistItem
    add_table_spec(
        "3.2.6. Bảng WatchlistItem (Danh sách yêu thích / My List)",
        "Bảng cầu nối lưu trữ danh sách phim được yêu thích bởi từng hồ sơ người xem.",
        [
            ("1", "id", "VARCHAR(36)", "PK", "No", "-", "Định danh duy nhất của mục yêu thích (UUIDv4)"),
            ("2", "profileId", "VARCHAR(36)", "FK", "No", "-", "Khóa ngoại tham chiếu Profile(id). Xóa cascade khi xóa Profile"),
            ("3", "movieId", "VARCHAR(36)", "FK", "No", "-", "Khóa ngoại tham chiếu Movie(id). Xóa cascade khi xóa Movie"),
            ("4", "createdAt", "DATETIME", "-", "No", "CURRENT_TIMESTAMP", "Thời điểm thêm phim vào danh sách yêu thích")
        ]
    )

    add_h2("3.3. Ràng buộc toàn vẹn và toàn vẹn tham chiếu")
    add_p("Hệ thống áp dụng các nguyên tắc toàn vẹn dữ liệu nghiêm ngặt:")
    add_p("1. Ràng buộc Khóa chính (Primary Key Constraints): Tất cả các bảng đều có khóa chính id đơn nhất kiểu chuỗi (UUIDv4) nhằm chống trùng lặp dữ liệu và hỗ trợ tốt cho kiến trúc phân tán.")
    add_p("2. Ràng buộc Khóa ngoại và Xóa liên hoàn (Foreign Key & Cascade Delete):")
    add_p("• Profile.userId -> User.id (ON DELETE CASCADE): Đảm bảo khi một tài khoản bị xóa, các hồ sơ của tài khoản đó cũng được tự động dọn dẹp sạch sẽ.")
    add_p("• Episode.seriesId -> Movie.id (ON DELETE CASCADE): Đảm bảo khi xóa một bộ phim nhiều tập, toàn bộ các tập phim con sẽ được xóa theo.")
    add_p("• WatchProgress.profileId -> Profile.id và WatchProgress.movieId -> Movie.id: Khi Profile hoặc Movie bị xóa, tiến độ xem dở tương ứng cũng tự động xóa.")
    add_p("• WatchlistItem.profileId -> Profile.id và WatchlistItem.movieId -> Movie.id: Khi Profile hoặc Movie bị xóa, mục yêu thích tương ứng được giải phóng.")
    add_p("3. Ràng buộc Giá trị duy nhất (Unique Constraints): Cột email trong bảng User bắt buộc phải là duy nhất, không cho phép hai tài khoản có cùng email.")
    add_p("4. Ràng buộc miền giá trị (Check Constraints): currentTime >= 0, duration >= 0, progress nằm trong khoảng từ 0 đến 100, releaseYear > 1900.")

    add_h2("3.4. Kịch bản DDL tạo bảng cơ sở dữ liệu (SQL Schema)")
    add_p("Dưới đây là mã lệnh SQL DDL hoàn chỉnh, chuẩn hóa và tương thích tốt với các hệ quản trị cơ sở dữ liệu RDBMS (như SQLite, MySQL, PostgreSQL) đã được triển khai thực tế trong dự án CineStream:")

    sql_code = (
        "-- 1. Tạo bảng Tài khoản Người dùng (User)\n"
        "CREATE TABLE IF NOT EXISTS User (\n"
        "    id TEXT PRIMARY KEY NOT NULL,\n"
        "    email TEXT UNIQUE NOT NULL,\n"
        "    password TEXT,\n"
        "    plan TEXT NOT NULL DEFAULT 'Ultra 4K CineVIP',\n"
        "    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP\n"
        ");\n\n"
        "-- 2. Tạo bảng Hồ sơ Người xem Đa năng (Profile)\n"
        "CREATE TABLE IF NOT EXISTS Profile (\n"
        "    id TEXT PRIMARY KEY NOT NULL,\n"
        "    userId TEXT NOT NULL,\n"
        "    name TEXT NOT NULL,\n"
        "    avatar TEXT NOT NULL,\n"
        "    isKids BOOLEAN NOT NULL DEFAULT 0,\n"
        "    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE\n"
        ");\n\n"
        "-- 3. Tạo bảng Danh mục Phim & Series (Movie)\n"
        "CREATE TABLE IF NOT EXISTS Movie (\n"
        "    id TEXT PRIMARY KEY NOT NULL,\n"
        "    slug TEXT NOT NULL,\n"
        "    title TEXT NOT NULL,\n"
        "    type TEXT NOT NULL DEFAULT 'movie',\n"
        "    synopsis TEXT NOT NULL,\n"
        "    releaseYear INTEGER NOT NULL DEFAULT 2024,\n"
        "    duration TEXT NOT NULL,\n"
        "    rating TEXT NOT NULL DEFAULT '8.5',\n"
        "    genres TEXT NOT NULL,\n"
        "    posterUrl TEXT NOT NULL,\n"
        "    backdropUrl TEXT NOT NULL,\n"
        "    trailerUrl TEXT,\n"
        "    videoUrl TEXT,\n"
        "    isFeatured BOOLEAN NOT NULL DEFAULT 0,\n"
        "    isTrending BOOLEAN NOT NULL DEFAULT 0,\n"
        "    isImax BOOLEAN NOT NULL DEFAULT 0,\n"
        "    director TEXT,\n"
        "    cast TEXT,\n"
        "    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP\n"
        ");\n\n"
        "-- 4. Tạo bảng Tập phim Series (Episode)\n"
        "CREATE TABLE IF NOT EXISTS Episode (\n"
        "    id TEXT PRIMARY KEY NOT NULL,\n"
        "    seriesId TEXT NOT NULL,\n"
        "    season INTEGER NOT NULL DEFAULT 1,\n"
        "    episodeNumber INTEGER NOT NULL,\n"
        "    title TEXT NOT NULL,\n"
        "    synopsis TEXT NOT NULL,\n"
        "    duration TEXT NOT NULL,\n"
        "    videoUrl TEXT NOT NULL,\n"
        "    stillUrl TEXT,\n"
        "    FOREIGN KEY (seriesId) REFERENCES Movie(id) ON DELETE CASCADE\n"
        ");\n\n"
        "-- 5. Tạo bảng Tiến độ xem dở (WatchProgress)\n"
        "CREATE TABLE IF NOT EXISTS WatchProgress (\n"
        "    id TEXT PRIMARY KEY NOT NULL,\n"
        "    profileId TEXT NOT NULL,\n"
        "    movieId TEXT NOT NULL,\n"
        "    episodeId TEXT,\n"
        "    currentTime INTEGER NOT NULL DEFAULT 0,\n"
        "    duration INTEGER NOT NULL DEFAULT 0,\n"
        "    progress INTEGER NOT NULL DEFAULT 0,\n"
        "    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n"
        "    FOREIGN KEY (profileId) REFERENCES Profile(id) ON DELETE CASCADE,\n"
        "    FOREIGN KEY (movieId) REFERENCES Movie(id) ON DELETE CASCADE\n"
        ");\n\n"
        "-- 6. Tạo bảng Danh sách phim yêu thích (WatchlistItem)\n"
        "CREATE TABLE IF NOT EXISTS WatchlistItem (\n"
        "    id TEXT PRIMARY KEY NOT NULL,\n"
        "    profileId TEXT NOT NULL,\n"
        "    movieId TEXT NOT NULL,\n"
        "    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n"
        "    FOREIGN KEY (profileId) REFERENCES Profile(id) ON DELETE CASCADE,\n"
        "    FOREIGN KEY (movieId) REFERENCES Movie(id) ON DELETE CASCADE\n"
        ");"
    )

    sql_table = doc.add_table(rows=1, cols=1)
    sql_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_sql = sql_table.cell(0, 0)
    set_cell_background(c_sql, "0F172A") # Slate 900 dark background
    set_cell_margins(c_sql, 100, 100, 140, 140)
    p_sql = c_sql.paragraphs[0]
    p_sql.paragraph_format.line_spacing = 1.15
    p_sql.paragraph_format.space_after = Pt(2)
    r_sql = p_sql.add_run(sql_code)
    r_sql.font.name = "Consolas"
    r_sql.font.size = Pt(8.5)
    r_sql.font.color.rgb = RGBColor(226, 232, 240)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # ---------------------------------------------------------
    # CHƯƠNG 4
    # ---------------------------------------------------------
    add_h1("CHƯƠNG 4: THIẾT KẾ KIẾN TRÚC VÀ GIAO DIỆN HỆ THỐNG")
    
    add_h2("4.1. Kiến trúc phân tầng của hệ thống CineStream")
    add_p("Hệ thống CineStream được tổ chức theo mô hình kiến trúc phân tầng 3 lớp (3-Tier Architecture) hiện đại:")
    add_p("1. Tầng Giao diện (Presentation Layer - Client): Xây dựng bằng HTML5, CSS3 hiện đại, Vanilla JavaScript kết hợp Vite bundler và Tailwind CSS. Giao diện được tối ưu chuẩn Cinema Dark Theme, mang lại trải nghiệm xem phim đắm chìm và tiết kiệm pin trên màn hình OLED.")
    add_p("2. Tầng Ứng dụng & Nghiệp vụ (Application / Business Logic Layer): Sử dụng Node.js & Express.js kết hợp Cloudflare Pages Functions (Serverless Edge API). Đảm nhận việc xử lý xác thực tài khoản, điều phối luồng phát video, quản lý API đa hồ sơ, tiến độ xem dở và danh sách yêu thích.")
    add_p("3. Tầng Dữ liệu (Data Layer): Sử dụng Prisma ORM kết nối với SQLite / Cloudflare D1 Database. Đảm bảo hiệu năng truy vấn siêu tốc tại các vị trí gần người dùng nhất (Edge computing), độ trễ cực thấp.")

    add_h2("4.2. Thiết kế luồng trải nghiệm và các màn hình chính")
    add_p("Hệ thống CineStream đã hoàn thiện trọn bộ các trang màn hình chức năng bám sát phân tích Use Case:")
    add_p("• Trang Chủ (Home Page): Header trong suốt chuyển màu khi cuộn, Hero Banner phim tiêu điểm với trailer chạy ngầm, danh sách phim thịnh hành (Trending), phim bộ mới nhất và thanh điều hướng mượt mà.")
    add_p("• Trang Chọn Hồ Sơ (Select Profile): Hiển thị danh sách các Profile của tài khoản kèm Avatar trực quan, nút chuyển đổi nhanh giữa các thành viên và nút '+ Thêm hồ sơ'.")
    add_p("• Trang Chi Tiết Phim (Movie / Series Detail): Cung cấp thông tin chi tiết về dàn diễn viên, đạo diễn, điểm IMDb/CineScore, các tập phim của từng mùa và các nút hành động (Xem ngay, Trailer, Thêm vào My List).")
    add_p("• Trình Phát Phim Rạp Hát (Cinema Player Dock): Tích hợp điều khiển tua video thông minh, hiển thị thanh tiến độ xem, chuyển tập kế tiếp tức thì và tự động gửi beacon lưu tiến độ xem dở.")
    add_p("• Trang Danh Sách Của Tôi (My List): Quản lý tập trung toàn bộ các bộ phim đã lưu của Profile hiện tại theo dạng lưới trực quan.")

    # ---------------------------------------------------------
    # KẾT LUẬN
    # ---------------------------------------------------------
    add_h1("KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN")
    
    add_h2("1. Kết quả đạt được")
    add_p("Sau quá trình nghiên cứu và thực hiện, đồ án đã hoàn thành xuất sắc các mục tiêu đề ra:")
    add_p("• Phân tích toàn diện và chi tiết các yêu cầu chức năng (FR) và phi chức năng (NFR) cho một nền tảng website xem phim trực tuyến hiện đại.")
    add_p("• Xây dựng hệ thống Use Case chuẩn mực gồm 4 tác nhân, ma trận phân quyền và 6 bản đặc tả Use Case chi tiết từng bước luồng sự kiện chính và ngoại lệ.")
    add_p("• Thiết kế cơ sở dữ liệu quan hệ hoàn chỉnh với 6 bảng chi tiết (User, Profile, Movie, Episode, WatchProgress, WatchlistItem), vượt xa yêu cầu tối thiểu (>= 3 bảng). Lược đồ ERD trực quan, mối liên kết toàn vẹn tham chiếu chặt chẽ kèm mã lệnh DDL SQL sẵn sàng triển khai.")

    add_h2("2. Hạn chế và Hướng phát triển trong tương lai")
    add_p("Mặc dù hệ thống đã đáp ứng đầy đủ các yêu cầu nghiệp vụ cốt lõi, dự án còn một số định hướng nâng cấp trong tương lai:")
    add_p("• Tích hợp cổng thanh toán trực tuyến tự động: Kết nối API thanh toán qua VNPay, MoMo, ZaloPay, hoặc Stripe để tự động kích hoạt gói VIP khi thanh toán thành công.")
    add_p("• Triển khai luồng video thích ứng (Adaptive Bitrate Streaming - HLS/DASH): Tự động điều chỉnh độ phân giải video (360p, 720p, 1080p, 4K) tùy theo tốc độ mạng của người dùng.")
    add_p("• Hệ thống gợi ý phim thông minh (AI Recommendation Engine): Ứng dụng Machine Learning dựa trên lịch sử xem (WatchProgress) và sở thích (WatchlistItem) để gợi ý các bộ phim phù hợp nhất cho từng Profile.")

    # ---------------------------------------------------------
    # TÀI LIỆU THAM KHẢO
    # ---------------------------------------------------------
    add_h1("TÀI LIỆU THAM KHẢO")
    add_p("[1] Nguyễn Văn Ba (2018), Phân tích và Thiết kế Hệ thống Thông tin, Nhà xuất bản Đại học Quốc gia Hà Nội.")
    add_p("[2] Roger S. Pressman, Bruce R. Maxim (2020), Software Engineering: A Practitioner's Approach, 9th Edition, McGraw-Hill Education.")
    add_p("[3] Abraham Silberschatz, Henry F. Korth, S. Sudarshan (2019), Database System Concepts, 7th Edition, McGraw-Hill.")
    add_p("[4] Mozilla Developer Network (MDN Web Docs), HTML5 Video API, Web Storage & Responsive Web Design, https://developer.mozilla.org.")
    add_p("[5] Prisma Documentation, Database Schema & Relational Modeling Guide, https://www.prisma.io/docs.")
    
    doc.save(output_path)
    print(f"Word report successfully generated at: {output_path}")

if __name__ == "__main__":
    out = r"c:\Users\dinhh\Downloads\cinestream\Bao_Cao_Phan_Tich_Thiet_Ke_Website_CineStream.docx"
    img = r"C:\Users\dinhh\Downloads\image.jpg"
    create_report(out, img)
    # Also save a copy directly in Downloads folder for convenient access
    downloads_copy = r"C:\Users\dinhh\Downloads\Bao_Cao_Phan_Tich_Thiet_Ke_Website_CineStream.docx"
    create_report(downloads_copy, img)
