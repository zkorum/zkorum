from detoxify import Detoxify
import sys



def get_key_with_highest_value_above_threshold(dictionary, threshold):
    # Filter keys based on the threshold
    filtered_keys = [key for key, value in dictionary.items() if value > threshold]
    
    # Check if there are any keys above the threshold
    if not filtered_keys:
        return "none"
    
    # Find the key with the maximum value among the filtered keys
    max_key = max(filtered_keys, key=dictionary.get)
    
    return max_key





def main():

    if len(sys.argv) < 2:
        print("none")
        sys.exit(1)
        return 

    # Read the argument
    argument = sys.argv[1]
    results = Detoxify('multilingual').predict(argument)
    result = get_key_with_highest_value_above_threshold(results, 0.4)
    print(result)
    return result


if __name__ == "__main__":
    main()