from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions


class PDFparser:
    def __init__(self):
        pipeline_options = PdfPipelineOptions()

        pipeline_options.do_ocr = False 
        pipeline_options.do_table_structure = True


        format_options = {
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
        self.converter = DocumentConverter(format_options=format_options)

    def process(self, pdf_path: str):

        result = self.converter.convert(pdf_path)
        doc = result.document

        return doc.export_to_markdown()

