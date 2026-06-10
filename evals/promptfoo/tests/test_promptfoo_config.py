from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path


EVAL_ROOT = Path(__file__).resolve().parents[1]


class TestPromptfooConfig(unittest.TestCase):
    def test_config_js_has_valid_syntax(self):
        subprocess.run(["node", "--check", "config.js"], cwd=EVAL_ROOT, check=True)

    def test_tier_configs_have_valid_syntax(self):
        subprocess.run(["node", "--check", "config-tier1.js"], cwd=EVAL_ROOT, check=True)
        subprocess.run(["node", "--check", "config-tier2.js"], cwd=EVAL_ROOT, check=True)

    def test_goldset_counts_match_metadata(self):
        goldset = json.loads((EVAL_ROOT / "goldset.json").read_text())
        examples = goldset["examples"]
        metadata = goldset["analysis_metadata"]
        self.assertEqual(len(goldset["criteria"]), metadata["total_criteria"])
        self.assertEqual(len(examples), metadata["total_examples"])
        self.assertEqual(
            sum(1 for example in examples if example["split"] == "train"),
            metadata["training_examples"],
        )
        self.assertEqual(
            sum(1 for example in examples if example["split"] == "holdout"),
            metadata["holdout_examples"],
        )
        self.assertEqual(
            sum(1 for example in examples if example["adversarial"]),
            metadata["adversarial_examples"],
        )


if __name__ == "__main__":
    unittest.main()
