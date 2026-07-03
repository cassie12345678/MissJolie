<?php
/**
 * Email Template Generator for Miss Jolie
 * Generates beautiful HTML emails with Miss Jolie branding
 */

function generateEmailTemplate($content, $title = "Miss Jolie") {
    $template = '
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . htmlspecialchars($title) . '</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            background-color: #000000;
            color: #ffffff;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #000000;
        }
        .email-header {
            background: linear-gradient(135deg, #1a0033, #2d0052);
            padding: 40px 20px;
            text-align: center;
            border-bottom: 3px solid #d896ff;
        }
        .email-header img {
            max-width: 200px;
            height: auto;
            margin-bottom: 20px;
        }
        .email-header h1 {
            color: #d896ff;
            margin: 0;
            font-size: 28px;
            text-shadow: 0 0 20px rgba(216, 150, 255, 0.5);
        }
        .email-body {
            background-color: #0a0015;
            padding: 40px 30px;
            line-height: 1.8;
            font-size: 16px;
        }
        .email-body p {
            margin: 0 0 20px 0;
            color: #cccccc;
        }
        .email-button {
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(135deg, #d896ff, #7b2cbf);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .email-footer {
            background-color: #000000;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #333;
        }
        .email-footer p {
            margin: 5px 0;
            font-size: 13px;
            color: #888;
        }
        .email-footer a {
            color: #d896ff;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #d896ff, transparent);
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <img src="https://miss-jolie.store/images/logo/miss-jolie-logo.jpeg" alt="Miss Jolie Logo">
            <h1>Miss Jolie</h1>
        </div>
        <div class="email-body">
            ' . $content . '
        </div>
        <div class="email-footer">
            <p>&copy; ' . date('Y') . ' Miss Jolie. Alle rechten voorbehouden.</p>
            <p>
                <a href="https://miss-jolie.store">www.miss-jolie.store</a> | 
                <a href="mailto:info@miss-jolie.store">info@miss-jolie.store</a>
            </p>
            <p style="font-size: 11px; margin-top: 15px;">
                Website ontworpen door <a href="https://cbwebdesign.nl">CB Web Design</a>
            </p>
        </div>
    </div>
</body>
</html>';
    
    return $template;
}

function sendHtmlEmail($to, $subject, $htmlContent, $title = "Miss Jolie") {
    $htmlBody = generateEmailTemplate($htmlContent, $title);
    
    $headers = "From: Miss Jolie <no-reply@miss-jolie.store>\r\n";
    $headers .= "Reply-To: info@miss-jolie.store\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    return mail($to, $subject, $htmlBody, $headers);
}
?>
