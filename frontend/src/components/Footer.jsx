import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <img src="https://www.image2url.com/r2/default/images/1776879285654-22c7a4ec-c02b-42da-88b6-f2d74cbc496f.png" alt="MovFlix" className="footer-logo" />
        <div className="footer-links">
          <span>Câu hỏi thường gặp</span>
          <span>Trung tâm trợ giúp</span>
          <span>Điều khoản sử dụng</span>
          <span>Chính sách bảo mật</span>
          <span>Tùy chọn cookie</span>
          <span>Thông tin doanh nghiệp</span>
          <span>Liên hệ với chúng tôi</span>
        </div>
        <p className="footer-copyright">© 2024 MovFlix. Bản quyền được bảo lưu.</p>
      </div>
    </footer>
  );
};

export default Footer;