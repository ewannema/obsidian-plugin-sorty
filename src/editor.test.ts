import { lineRangeFromSelection } from './editor';

describe('lineRangeFromSelection', () => {
	it('should return from/to in correct order when anchor < head', () => {
		const result = lineRangeFromSelection(5, 10);
		expect(result).toEqual({ fromLine: 5, toLine: 10 });
	});

	it('should return from/to in correct order when head < anchor', () => {
		const result = lineRangeFromSelection(10, 5);
		expect(result).toEqual({ fromLine: 5, toLine: 10 });
	});

	it('should handle single line selection', () => {
		const result = lineRangeFromSelection(7, 7);
		expect(result).toEqual({ fromLine: 7, toLine: 7 });
	});

	it('should handle line 0', () => {
		const result = lineRangeFromSelection(0, 5);
		expect(result).toEqual({ fromLine: 0, toLine: 5 });
	});
});
