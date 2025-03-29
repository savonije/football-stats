import { ref, watch, type Ref } from 'vue';

/**
 * A composable that returns a debounced value of a given ref.
 *
 * @param value - The ref to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns A new ref that only updates after the debounce delay
 */
export function useDebounce<T>(value: Ref<T>, delay: number): Ref<T> {
    const debouncedValue = ref(value.value) as Ref<T>;
    let timeout: ReturnType<typeof setTimeout>;

    // Watch the original ref for changes
    watch(
        value,
        (newValue) => {
            // Clear the previous timeout to restart the debounce timer
            clearTimeout(timeout);

            // Set a new timeout to update the debounced value
            timeout = setTimeout(() => {
                debouncedValue.value = newValue;
            }, delay);
        },
        { immediate: true },
    ); // Optionally set immediate to true if you want to initialize immediately

    return debouncedValue;
}
