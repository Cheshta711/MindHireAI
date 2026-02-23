from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from datetime import datetime
from typing import Dict

class ReportService:
    def generate_pdf_report(self, candidate_name: str, evaluation: Dict, interview_date: datetime) -> BytesIO:
        """Generate a PDF report for the interview evaluation"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#7e22ce'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#581c87'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        # Title
        elements.append(Paragraph("MindHire AI - Interview Evaluation Report", title_style))
        elements.append(Spacer(1, 12))
        
        # Candidate Info
        elements.append(Paragraph(f"<b>Candidate:</b> {candidate_name}", styles['Normal']))
        elements.append(Paragraph(f"<b>Interview Date:</b> {interview_date.strftime('%B %d, %Y')}", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Scores Section
        elements.append(Paragraph("Performance Scores", heading_style))
        
        score_data = [
            ['Metric', 'Score'],
            ['Technical Skills', f"{evaluation.get('technical_score', 0):.1f}/100"],
            ['Communication', f"{evaluation.get('communication_score', 0):.1f}/100"],
            ['Emotional Stability', f"{evaluation.get('emotional_stability_score', 0):.1f}/100"],
            ['Overall Score', f"{evaluation.get('overall_score', 0):.1f}/100"]
        ]
        
        score_table = Table(score_data, colWidths=[3*inch, 2*inch])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#d8b4fe')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2e1065')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e9d5ff')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f3e8ff'))
        ]))
        
        elements.append(score_table)
        elements.append(Spacer(1, 20))
        
        # Strengths
        elements.append(Paragraph("Key Strengths", heading_style))
        strengths = evaluation.get('strengths', [])
        for strength in strengths:
            elements.append(Paragraph(f"• {strength}", styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # Areas for Improvement
        elements.append(Paragraph("Areas for Improvement", heading_style))
        improvements = evaluation.get('improvements', [])
        for improvement in improvements:
            elements.append(Paragraph(f"• {improvement}", styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # Psychological Profile
        elements.append(Paragraph("Psychological Profile", heading_style))
        elements.append(Paragraph(f"<b>Overall Sentiment:</b> {evaluation.get('sentiment_analysis', 'N/A').title()}", styles['Normal']))
        
        stress_markers = evaluation.get('stress_markers', [])
        if stress_markers:
            elements.append(Paragraph(f"<b>Stress Indicators Detected:</b> {len(stress_markers)}", styles['Normal']))
            for marker in stress_markers[:3]:
                elements.append(Paragraph(f"  - {marker}", styles['Normal']))
        else:
            elements.append(Paragraph("<b>Stress Indicators:</b> None detected", styles['Normal']))
        
        elements.append(Spacer(1, 20))
        
        # Disclaimer
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.grey,
            alignment=TA_LEFT
        )
        elements.append(Paragraph(
            "<i>Note: This is an AI-generated assessment and should not be considered as a clinical psychological diagnosis. "
            "It is intended for recruitment and talent assessment purposes only.</i>",
            disclaimer_style
        ))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer