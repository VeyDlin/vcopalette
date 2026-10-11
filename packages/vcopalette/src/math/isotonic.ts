interface Block {
    value: number;
    weight: number;
    count: number;
}


/** Weighted pool-adjacent-violators: the closest non-increasing sequence to `values`. */
export function isotonicNonIncreasing(values: readonly number[], weights: readonly number[]): number[] {
    const blocks: Block[] = [];
    let size: number = 0;

    for (let i: number = 0; i < values.length; i++) {
        blocks[size] = { value: values[i], weight: weights[i], count: 1 };
        size++;

        while (size > 1 && blocks[size - 2].value < blocks[size - 1].value) {
            const prev: Block = blocks[size - 2];
            const last: Block = blocks[size - 1];
            const weight: number = prev.weight + last.weight;

            blocks[size - 2] = {
                value: (prev.value * prev.weight + last.value * last.weight) / weight,
                weight: weight,
                count: prev.count + last.count,
            };
            size--;
        }
    }

    const result: number[] = [];

    for (let b: number = 0; b < size; b++) {
        for (let k: number = 0; k < blocks[b].count; k++) {
            result.push(blocks[b].value);
        }
    }

    return result;
}
