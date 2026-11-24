import unittest
from datetime import date
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from weekly_seo_audit import windows, totals, indexed, candidates, ga_rows, render
class TestAudit(unittest.TestCase):
    def test_windows(self):
        current,previous=windows(date(2026,11,24))
        self.assertEqual(tuple(map(str,current)),("2026-10-25","2026-11-21"))
        self.assertEqual(tuple(map(str,previous)),("2026-09-27","2026-10-24"))
    def test_empty_data(self):
        self.assertEqual(totals({})["clicks"],0)
        self.assertEqual(indexed({}),{})
    def test_small_impressions_excluded(self):
        current={("small",):dict(clicks=0,impressions=15,ctr=0,position=9),
                 ("real",):dict(clicks=0,impressions=100,ctr=0,position=11)}
        self.assertEqual(len(candidates(current,{})),1)
        self.assertEqual(candidates(current,{})[0][0],("real",))
    def test_ga4_event_rows(self):
        response={"dimensionHeaders":[{"name":"eventName"}],"rows":[{"dimensionValues":[{"value":"comparison_input_start"}],"metricValues":[{"value":"4"}]}]}
        self.assertEqual(ga_rows(response)[0]["eventCount"],4)
    def test_render(self):
        periods=windows(date(2026,11,24))
        zeros=dict(clicks=0,impressions=0,ctr=0,position=0)
        out=render(*periods,(zeros,zeros),{"クエリ":({},{})})
        self.assertIn("2026-11-21",out)
        self.assertIn("読み取り専用",out)
if __name__=="__main__":unittest.main()
