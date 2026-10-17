import importlib.util
from pathlib import Path
import tempfile
import unittest
from PIL import Image

PATH=Path(__file__).resolve().parents[1]/'scripts/audit_submission.py'
spec=importlib.util.spec_from_file_location('submission_audit',PATH)
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class SubmissionAudit(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
    def tearDown(self):self.temp.cleanup()
    def test_file_checks_cannot_approve_content_or_submission(self):
        path=self.root/'123.jpg';Image.new('RGB',(594,841)).save(path)
        result=module.audit(path,participant_number='123')
        self.assertTrue(result['automatedChecksPassed'])
        self.assertFalse(result['submissionReady'])
        self.assertIn('English and legibility',result['manualChecksRequired'])
    def test_png_disguised_as_jpeg_and_wrong_ratio_fail(self):
        path=self.root/'123.jpg';Image.new('RGB',(600,600)).save(path,format='PNG')
        issues=module.inspect(path,15,participant_number='123')['issues']
        self.assertIn('actual file encoding must be JPEG',issues)
        self.assertIn('aspect ratio does not match the required board dimensions',issues)
    def test_missing_number_filename_and_embedded_author_fail(self):
        path=self.root/'named-author.jpg';exif=Image.Exif();exif[315]='TEST AUTHOR'
        Image.new('RGB',(594,841)).save(path,exif=exif)
        self.assertTrue(module.inspect(path,15)['issues'])
        issues=module.inspect(path,15,participant_number='123')['issues']
        self.assertIn('filename must contain only the participant order number',issues)
        self.assertTrue(any('metadata' in x for x in issues))

if __name__=='__main__':unittest.main()
