from django.conf import settings
from django.core.mail import send_mail


class Email(object):
    @staticmethod
    def send_assignee_email(to_email, url):
        """
        发激活邮件
        @param to_email: 收件人邮箱
        @param url: 邮箱激活url
        @return:
        """
        subject = "分配通知"
        html_message = '<p>尊敬的用户您好！</p>' \
                       '<p>感谢您使用讯盟科技数据标注平台。</p>' \
                       '<p>您的邮箱为：%s 。请点击此跳转到分配给您的作业/任务/项目：</p>' \
                       '<p><a href="%s">%s<a></p>' % (to_email, url, url)
        # send_mail(subject:标题, message:普通邮件正文, 发件人, [收件人], html_message: 超文本的邮件内容)
        send_mail(subject, "", settings.DEFAULT_FROM_EMAIL, [to_email], html_message=html_message)
