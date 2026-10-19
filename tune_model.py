from backend.pipeline import ChurnMLPipeline
import json
if __name__ == '__main__':
    pipeline = ChurnMLPipeline()
    result = pipeline.optimize_model()
    print(json.dumps({'selection': pipeline.selection_report, 'held_out': result['test_metrics']}, indent=2))
